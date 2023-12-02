import "./chromatic.css";

import { AudioController } from "./audio";
import { Wave, waveType } from "./instruments";
import { Scope } from "./scope";
import { Song } from "./song";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const KEY_POSITIONS = [0, 0.5, 1, 1.5, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6];
const audio = new AudioController();

const song = new Song();
const instrumentSelectorOptions = [];

let instrument = song.instruments[0];
let instrumentIndex = 0;

let waveformGenerator = instrument.getFrameCallback(440);
let currentKey = null;

const instrumentEditor = (
    <div class="instrument-editor">
        <div class="section">
            <div class="left-col">
                <label for="name">Instrument name</label>
                <input id="name" />
                <canvas id="scope" width="256" height="128"></canvas>
            </div>
            <div id="parameters">
                <div>
                    <label for="wave-type">Wave type</label>
                    <select id="wave-type">
                        <option value="1" selected>square</option>
                        <option value="2">triangle</option>
                        <option value="3">sine</option>
                        <option value="4">noise</option>
                    </select>
                </div>
                <div>
                    <label for="transpose">Transpose</label>
                    <input type="number" min="-24" max="24" value="0" id="transpose" />
                </div>
                <div>
                    <label for="slide-step">Pitch slide step</label>
                    <input type="number" min="-256" max="256" value="0" id="slide-step" />
                </div>
                <fieldset id="fieldset-phase">
                    <legend>Phase</legend>
                    <div>
                        <label for="phase-min">Min</label>
                        <input type="number" min="0" max="32" value="16" id="phase-min" />
                    </div>
                    <div>
                        <label for="phase-max">Max</label>
                        <input type="number" min="0" max="32" value="16" id="phase-max" />
                    </div>
                    <div>
                        <label for="phase-period">Period</label>
                        <input type="number" min="0" max="256" value="64" id="phase-period" />
                    </div>
                </fieldset>
                <fieldset>
                    <legend>Envelope</legend>
                    <div>
                        <label for="decay-speed">Decay speed</label>
                        <input type="number" min="0" max="256" value="16" id="decay-speed" />
                    </div>
                    <div>
                        <label for="decay-to">Decay to volume</label>
                        <input type="number" min="0" max="15" value="0" id="decay-to" />
                    </div>
                </fieldset>
                <fieldset>
                    <legend>Vibrato</legend>
                    <div>
                        <label for="vibrato-depth">Depth</label>
                        <input type="number" min="0" max="256" value="0" id="vibrato-depth" />
                    </div>
                    <div>
                        <label for="vibrato-period">Period</label>
                        <input type="number" min="0" max="256" value="16" id="vibrato-period" />
                    </div>
                </fieldset>
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
)

document.querySelector(".editor").appendChild(instrumentEditor);

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
        const option = document.createElement('option');
        option.value = i;
        option.innerText = `${i+1} - ${song.instruments[i].name}`;
        instrumentSelector.appendChild(option);
        instrumentSelectorOptions[i] = option;
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

    const scopeCanvas = document.getElementById("scope");
    const scope = new Scope(scopeCanvas);
    const scrubControl = document.getElementById("scrub");
    const scrubValue = document.getElementById("scrub-value");
    const drawScopeAtScrubPosition = () => {
        scope.drawFrame(waveformGenerator(scrubControl.value));
    }
    scrubControl.addEventListener('input', () => {
        drawScopeAtScrubPosition();
        scrubValue.innerText = scrubControl.value;
    });

    const phaseFieldset = document.getElementById("fieldset-phase");
    const harmonicsFieldset = document.getElementById("fieldset-harmonics");
    const controls = [];
    const initControl = (inputId, param, onchange) => {
        const elem = document.getElementById(inputId);
        elem.value = instrument[param];
        elem.addEventListener('input', () => {
            instrument[param] = parseInt(elem.value);
            waveformGenerator = instrument.getFrameCallback(440);
            drawScopeAtScrubPosition();
            if (onchange) onchange(elem.value);
        });
        controls.push({
            element: elem,
            param: param,
        });
    }
    const updateControlStateForWaveType = (wt) => {
        if (wt == waveType.NOISE) {
            phaseFieldset.setAttribute('disabled', 'true');
            harmonicsFieldset.setAttribute('disabled', 'true');
        } else if (wt == waveType.SINE) {
            phaseFieldset.setAttribute('disabled', 'true');
            harmonicsFieldset.removeAttribute('disabled');
        } else {
            phaseFieldset.removeAttribute('disabled');
            harmonicsFieldset.removeAttribute('disabled');
        }
    };

    initControl("wave-type", "waveType", (val) => {
        updateControlStateForWaveType(val);
    });
    initControl("transpose", "transpose");
    initControl("slide-step", "slideStep");
    initControl("phase-min", "phaseMin");
    initControl("phase-max", "phaseMax");
    initControl("phase-period", "phasePeriod");
    initControl("decay-to", "decayTo");
    initControl("decay-speed", "decaySpeed");
    initControl("vibrato-depth", "vibratoDepth");
    initControl("vibrato-period", "vibratoPeriod");

    const nameInput = document.getElementById("name");
    nameInput.value = instrument.name;
    nameInput.addEventListener('input', () => {
        instrument.name = nameInput.value;
        instrumentSelectorOptions[instrumentIndex].innerText = `${instrumentIndex+1} - ${instrument.name}`;
    });

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
        nameInput.value = instrument.name;
        for (let i = 0; i < controls.length; i++) {
            controls[i].element.value = instrument[controls[i].param];
        }
        for (let i = 0; i < 8; i++) {
            harmonicsUl.children[i].children[0].value = instrument.harmonics[i];
        }
        updateControlStateForWaveType(instrument.waveType);

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
