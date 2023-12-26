import { Component, Container, Fieldset, NumberInput, RangeInput, SelectInput, TextInput } from 'catwalk-ui';

import "./chromatic.css";

import { AudioController } from "./audio";
import { Wave, waveType } from "./instruments";
import { Scope } from "./scope";
import { Song } from "./song";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const KEY_POSITIONS = [0, 0.5, 1, 1.5, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6];
const audio = new AudioController();

const song = new Song();

let instrument = song.instruments[0];

let currentKey = null;

class PhaseFieldset extends Fieldset.withOptions({legend: "Phase"}) {
    static components = {
        phaseMinInput: NumberInput.forField(Wave.fields.phaseMin, {label: "Min"}),
        phaseMaxInput: NumberInput.forField(Wave.fields.phaseMax, {label: "Max"}),
        phasePeriodInput: NumberInput.forField(Wave.fields.phasePeriod, {label: "Period"}),
    }
    constructor(options) {
        super(options);
        this.trackField(Wave.fields.waveType, (wt) => {
            if (wt == waveType.NOISE || wt == waveType.SINE) {
                this.node.setAttribute('disabled', 'true');
            } else {
                this.node.removeAttribute('disabled');
            }
        });
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

class HarmonicsPanel extends Component {
    static elementInput = NumberInput.forField(Wave.fields.harmonics.subfield, {attributes: {step: 0.1}});
    static elementCount = Wave.fields.harmonics.length;

    constructor(options) {
        super(options);
        this.trackField(Wave.fields.waveType, (wt) => {
            if (wt == waveType.NOISE) {
                this.node.setAttribute('disabled', 'true');
            } else {
                this.node.removeAttribute('disabled');
            }
        });
        this.elementInputs = null;
        this.changeHarmonicHandler = (i, val) => {
            if (this.elementInputs) {
                this.elementInputs[i].node.value = val;
            }
        }
    }

    createNode() {
        this.elementInputs = [];
        const ul = <ul id="harmonics"></ul>
        for (let i = 0; i < HarmonicsPanel.elementCount; i++) {
            const li = <li></li>;
            const elementInput = this.createHarmonicInput(i);
            this.elementInputs[i] = elementInput;
            li.appendChild(elementInput.node);
            ul.appendChild(li);
        }
        return (
            <fieldset>
                <legend>Harmonics</legend>
                {ul}
            </fieldset>
        );
    }
    createHarmonicInput(i) {
        const input = new HarmonicsPanel.elementInput();
        input.node.addEventListener('change', () => {
            if (this.model) {
                this.model.setHarmonic(i, input.node.value);
                // read back the value from the model, in case it was cleaned
                input.node.value = this.model.harmonics[i];
            }
        });
        return input;
    }

    trackModel(model) {
        if (this.model) {
            this.model.removeListener("changeHarmonic", this.changeHarmonicHandler);
        }
        super.trackModel(model);
        if (this.elementInputs) {
            for (let i = 0; i < HarmonicsPanel.elementCount; i++) {
                this.elementInputs[i].node.value = model.harmonics[i];
            }
        }
        model.on("changeHarmonic", this.changeHarmonicHandler);
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
instrumentEditor.trackModel(instrument);
document.querySelector(".editor").appendChild(instrumentEditor.node);

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

    const instrumentSelector = document.getElementById("instrument");
    for (let i = 0; i < song.instruments.length; i++) {
        const instrument = song.instruments[i];
        const option = document.createElement('option');
        option.value = i;
        option.innerText = `${i+1} - ${instrument.name}`;
        instrument.on("changeName", (name) => {
            option.innerText = `${i+1} - ${name}`;
        });
        instrumentSelector.appendChild(option);
    }

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

    const generateCodeButton = document.getElementById("generate-code");
    const codeOutput = document.getElementById("code-output");
    generateCodeButton.addEventListener('click', () => {
        codeOutput.value = song.getLuaCode();
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
    })
});
