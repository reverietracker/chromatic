import { Container, Fieldset, InputList, NumberInput, RangeInput, SelectInput, TextInput } from 'catwalk-ui';
import { saveSync } from 'save-file';
import fileDialog from 'file-dialog';

import "./chromatic.css";

import { AudioController } from "./audio";
import { Wave, waveType } from "./instruments";
import { Scope } from "./scope";
import { Song } from "./song";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const KEY_POSITIONS = [0, 0.5, 1, 1.5, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6];
const audio = new AudioController();

let song, instrument;

let currentKey = null;

class PhaseFieldset extends Fieldset.withOptions({legend: "Phase"}) {
    static components = {
        phaseMinInput: NumberInput.forField(Wave.fields.phaseMin, {label: "Min"}),
        phaseMaxInput: NumberInput.forField(Wave.fields.phaseMax, {label: "Max"}),
        phasePeriodInput: NumberInput.forField(Wave.fields.phasePeriod, {label: "Period"}),
    }
}

class EnvelopeFieldset extends Fieldset.withOptions({legend: "Envelope"}) {
    static components = {
        decaySpeedInput: NumberInput.forField(Wave.fields.decaySpeed),
        decayToInput: NumberInput.forField(Wave.fields.decayTo),
    }
}

class VibratoFieldset extends Fieldset.withOptions({legend: "Vibrato"}) {
    static components = {
        vibratoDepthInput: NumberInput.forField(Wave.fields.vibratoDepth, {label: "Depth"}),
        vibratoPeriodInput: NumberInput.forField(Wave.fields.vibratoPeriod, {label: "Period"}),
    }
}

class HarmonicsPanel extends InputList.forField(Wave.fields.harmonics, {
    elementInputClass: NumberInput.forField(Wave.fields.harmonics.subfield, {attributes: {step: 0.1}}),
}) {
    createNode() {
        const ul = super.createNode();
        ul.id = "harmonics";
        return (
            <fieldset>
                <legend>Harmonics</legend>
                {ul}
            </fieldset>
        );
    }
}

class InstrumentEditor extends Container {
    static components = {
        waveTypeInput: SelectInput.forField(Wave.fields.waveType, {label: "Wave type"}),
        nameInput: TextInput.forField(Wave.fields.name, {label: "Instrument name"}),
        transposeInput: NumberInput.forField(Wave.fields.transpose),
        slideStepInput: NumberInput.forField(Wave.fields.slideStep),
        phaseFieldset: PhaseFieldset,
        envelopeFieldset: EnvelopeFieldset,
        vibratoFieldset: VibratoFieldset,
        harmonicsPanel: HarmonicsPanel,
        scope: Scope,
        scrubControl: RangeInput.withOptions({id: "scrub", label: "Time", min: 0, max: 60, value: 0}),
    }

    constructor() {
        super();
        this.scope.scrubControlNode = this.scrubControl.node;

        this.trackField(Wave.fields.waveType, (wt) => {
            if (wt == waveType.NOISE || wt == waveType.SINE || wt == waveType.SAMPLE) {
                this.phaseFieldset.node.setAttribute('disabled', 'true');
            } else {
                this.phaseFieldset.node.removeAttribute('disabled');
            }

            if (wt == waveType.NOISE || wt == waveType.SAMPLE) {
                this.harmonicsPanel.node.setAttribute('disabled', 'true');
            } else {
                this.harmonicsPanel.node.removeAttribute('disabled');
            }

            if (wt == waveType.SAMPLE) {
                this.envelopeFieldset.node.setAttribute('disabled', 'true');
                this.vibratoFieldset.node.setAttribute('disabled', 'true');
                this.slideStepInput.node.setAttribute('disabled', 'true');
                this.transposeInput.node.setAttribute('disabled', 'true');
            } else {
                this.envelopeFieldset.node.removeAttribute('disabled');
                this.vibratoFieldset.node.removeAttribute('disabled');
                this.slideStepInput.node.removeAttribute('disabled');
                this.transposeInput.node.removeAttribute('disabled');
            }
        });
    }

    createNode() {
        return (
            <div class="instrument-editor">
                <div class="section">
                    <div class="left-col">
                        {this.nameInput.labelNode}
                        {this.nameInput}
                        {this.scope}
                    </div>
                    <div id="parameters">
                        <div>
                            {this.waveTypeInput.labelNode}
                            {this.waveTypeInput}
                        </div>
                        <div>
                            {this.transposeInput.labelNode}
                            {this.transposeInput}
                        </div>
                        <div>
                            {this.slideStepInput.labelNode}
                            {this.slideStepInput}
                        </div>
                        {this.phaseFieldset}
                        {this.envelopeFieldset}
                        {this.vibratoFieldset}
                        <div class="section">
                            {this.harmonicsPanel}
                        </div>
                    </div>
                </div>
                <div class="section">
                    {this.scrubControl.labelNode}
                    {this.scrubControl}
                    <span id="scrub-value"></span>
                </div>
                <ul id="keyboard"></ul>
            </div>
        );
    }
}

const instrumentEditor = new InstrumentEditor();
document.querySelector(".editor").appendChild(instrumentEditor.node);
const instrumentSelector = document.getElementById("instrument");

const openSong = (newSong) => {
    song = newSong;
    instrument = song.instruments[1];
    instrumentEditor.trackModel(instrument);

    instrumentSelector.replaceChildren();
    for (let i = 1; i < song.instruments.length; i++) {
        const instrument = song.instruments[i];
        const option = document.createElement('option');
        option.value = i;
        option.innerText = `${i} - ${instrument.name}`;
        instrument.on("changeName", (name) => {
            option.innerText = `${i} - ${name}`;
        });
        instrumentSelector.appendChild(option);
    }
}

class Key {
    constructor(container, oct, n){
        const noteVal = (oct*12 + n) - 33;
        const noteName = NOTE_NAMES[n] + oct;
        this.frequency = 440 * 2**(noteVal/12);
        this.button = document.createElement('button');
        this.button.className = 'key';
        if ([1, 3, 6, 8, 10].includes(n)) {
            this.button.classList.add('black');
        } else {
            this.button.classList.add('white');
        }
        this.button.style.left = (((oct-1) * 7 + KEY_POSITIONS[n]) * 32) + 'px';
        this.button.innerText = noteName;
        container.appendChild(this.button);
        this.button.addEventListener("mousedown", () => {
            this.play();
        });
    }
    play() {
        currentKey = this;
        this.button.classList.add('active');
        const frameCallback = instrument.getFrameCallback(this.frequency);
        audio.play(frameCallback);
    }
    release() {
        this.button.classList.remove('active');
        audio.stop();
        currentKey = null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const masterVolumeControl = document.getElementById("master-volume");
    audio.setVolume(masterVolumeControl.value / 1000);
    masterVolumeControl.addEventListener('input', () => {
        audio.setVolume(masterVolumeControl.value / 1000);
    })

    const keyboard = document.getElementById("keyboard");
    for (let oct=1; oct<4; oct++) {
        for (let n=0; n<12; n++) {
            new Key(keyboard, oct, n);
        }
    }
    window.addEventListener('mouseup', () => {
        if (currentKey) currentKey.release();
    });

    const scope = instrumentEditor.scope;
    const scrubControl = instrumentEditor.scrubControl.node;
    const scrubValue = document.getElementById("scrub-value");
    scrubControl.addEventListener('input', () => {
        scope.drawAtScrubPosition();
        scrubValue.innerText = scrubControl.value;
    });

    const openButton = document.getElementById("open");
    openButton.addEventListener('click', () => {
        fileDialog().then(files => {
            files[0].text().then(text => {
                const newSong = Song.fromJSON(text);
                openSong(newSong);
            });
        });
    });

    const saveButton = document.getElementById("save");
    saveButton.addEventListener('click', () => {
        saveSync(song.toJSON(), "song.cmt");
    });

    const exportButton = document.getElementById("export");
    exportButton.addEventListener('click', () => {
        saveSync(song.getLuaCode(), "song.lua");
    });

    instrumentSelector.addEventListener('change', () => {
        const instrumentIndex = parseInt(instrumentSelector.value);
        instrument = song.instruments[instrumentIndex];
        instrumentEditor.trackModel(instrument);
    });

    audio.on('frame', (frameData) => {
        scope.drawFrame(frameData);
    });
    audio.on('stop', () => {
        scope.drawAtScrubPosition();
    });

    openSong(new Song());
});
