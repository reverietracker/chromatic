import { Container, Fieldset, NumberInput, SelectInput, TextInput } from 'catwalk-ui';

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
let instrumentIndex = 0;

let waveformGenerator = instrument.getFrameCallback(440);
let currentKey = null;

class PhaseFieldset extends Fieldset.withOptions({legend: "Phase"}) {
    static components = {
        phaseMinInput: NumberInput.forField(Wave.fields.phaseMin, {label: "Min"}),
        phaseMaxInput: NumberInput.forField(Wave.fields.phaseMax, {label: "Max"}),
        phasePeriodInput: NumberInput.forField(Wave.fields.phasePeriod, {label: "Period"}),
    }
    constructor(options) {
        super(options);
        this.model = null;
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


class InstrumentEditor extends Container {
    static components = {
        waveTypeInput: SelectInput.forField(Wave.fields.waveType, {label: "Wave type"}),
        nameInput: TextInput.forField(Wave.fields.name, {label: "Instrument name"}),
        transposeInput: NumberInput.forField(Wave.fields.transpose),
        slideStepInput: NumberInput.forField(Wave.fields.slideStep),
        phaseFieldset: PhaseFieldset,
        envelopeFieldset: EnvelopeFieldset,
        vibratoFieldset: VibratoFieldset,
        scope: Scope,
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
                            <fieldset id="fieldset-harmonics">
                                <legend>Harmonics</legend>
                                <ul id="harmonics"></ul>
                            </fieldset>
                        </div>
                    </div>
                </div>
                <div class="section">
                    <label for="scrub">time</label> <input type="range" min="0" max="60" value="0" id="scrub" /> <span id="scrub-value"></span>
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
    const scrubControl = document.getElementById("scrub");
    const scrubValue = document.getElementById("scrub-value");
    const drawScopeAtScrubPosition = () => {
        scope.drawFrame(waveformGenerator(scrubControl.value));
    }
    scrubControl.addEventListener('input', () => {
        drawScopeAtScrubPosition();
        scrubValue.innerText = scrubControl.value;
    });

    /*
    const initControl = (inputId, param, onchange) => {
        const elem = document.getElementById(inputId);
        elem.addEventListener('input', () => {
            waveformGenerator = instrument.getFrameCallback(440);
            drawScopeAtScrubPosition();
        });
    }
    const updateControlStateForWaveType = (wt) => {
        if (wt == waveType.NOISE) {
            harmonicsFieldset.setAttribute('disabled', 'true');
        } else {
            harmonicsFieldset.removeAttribute('disabled');
        }
    };
    */

    const harmonicsUl = document.getElementById('harmonics');
    const initHarmonicControl = (i) => {
        const input = document.createElement('input');
        input.type = 'number';
        input.min = 0;
        input.max = 1;
        input.step = 0.1;
        input.value = instrument.harmonics[i];
        const li = document.createElement('li');
        harmonicsUl.appendChild(li);
        li.appendChild(input);
        input.addEventListener('input', () => {
            instrument.harmonics[i] = input.value;
            waveformGenerator = instrument.getFrameCallback(440);
            drawScopeAtScrubPosition();
        })
    }
    for (var i = 0; i < 8; i++) {
        initHarmonicControl(i);
    }

    const generateCodeButton = document.getElementById("generate-code");
    const codeOutput = document.getElementById("code-output");
    generateCodeButton.addEventListener('click', () => {
        codeOutput.value = song.getLuaCode();
    });

    instrumentSelector.addEventListener('change', () => {
        instrumentIndex = parseInt(instrumentSelector.value);
        instrument = song.instruments[instrumentIndex];
        instrumentEditor.trackModel(instrument);
        for (let i = 0; i < 8; i++) {
            harmonicsUl.children[i].children[0].value = instrument.harmonics[i];
        }

        waveformGenerator = instrument.getFrameCallback(440);
        drawScopeAtScrubPosition();
    });

    waveformGenerator = instrument.getFrameCallback(440);
    drawScopeAtScrubPosition();

    audio.on('frame', (frameData) => {
        scope.drawFrame(frameData);
    });
    audio.on('stop', () => {
        drawScopeAtScrubPosition();
    })
});
