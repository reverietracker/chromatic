import { Component, Container, Fieldset, InputList, NumberInput, RangeInput, SelectInput, TextInput } from 'catwalk-ui';

import { Wave, waveType } from "../models/instruments";
import { Scope } from "./scope";
import { NOTE_NAMES } from "../defs";

const KEY_POSITIONS = [0, 0.5, 1, 1.5, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6];

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

let currentKey = null;

class Key {
    constructor(container, oct, n, editor){
        this.editor = editor;
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
        this.editor.audio.playInstrument(this.editor.model, this.frequency);
    }
    release() {
        this.button.classList.remove('active');
        this.editor.audio.stop();
        currentKey = null;
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

    constructor(audio) {
        super();
        this.audio = audio;
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

        this.audio.on('frame', (frameData) => {
            if (frameData[0]) this.scope.drawFrame(frameData[0]);
        });
        this.audio.on('stop', () => {
            this.scope.drawAtScrubPosition();
        });
    }

    createNode() {
        const node = (
            <div>
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
        const keyboard = node.querySelector("#keyboard");

        for (let oct=1; oct<4; oct++) {
            for (let n=0; n<12; n++) {
                new Key(keyboard, oct, n, this);
            }
        }
        window.addEventListener('mouseup', () => {
            if (currentKey) currentKey.release();
        });

        const scrubControl = this.scrubControl.node;
        const scrubValue = node.querySelector("#scrub-value");
        scrubControl.addEventListener('input', () => {
            this.scope.drawAtScrubPosition();
            scrubValue.innerText = scrubControl.value;
        });

        return node;
    }
}

export class InstrumentPanel extends Component {
    constructor(audio) {
        super();
        this.instrumentEditor = new InstrumentEditor(audio);
    }

    createNode() {
        const node = (
            <div class="instrument-panel">
                <div class="toolbar">
                    <label for="instrument">Instruments</label> <select id="instrument"></select>
                    <button id="close-instrument-panel">Close</button>
                </div>
                {this.instrumentEditor}
            </div>
        );
        this.instrumentSelector = node.querySelector("#instrument");
        this.instrumentSelector.addEventListener('change', () => {
            const instrumentIndex = parseInt(this.instrumentSelector.value);
            const instrument = this.model.instruments[instrumentIndex];
            this.instrumentEditor.trackModel(instrument);
        });
    
        return node;
    }

    trackModel(song) {
        super.trackModel(song);
        this.instrumentEditor.trackModel(song.instruments[1]);

        this.instrumentSelector.replaceChildren();
        for (let i = 1; i < song.instruments.length; i++) {
            const instrument = song.instruments[i];
            const option = document.createElement('option');
            option.value = i;
            option.innerText = `${i} - ${instrument.name}`;
            instrument.on("changeName", (name) => {
                option.innerText = `${i} - ${name}`;
            });
            this.instrumentSelector.appendChild(option);
        }
    }
}
