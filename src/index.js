import "./chromatic.css";

import { AudioController } from "./audio";
import { Wave, waveType } from "./instruments";
import { Scope } from "./scope";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const KEY_POSITIONS = [0, 0.5, 1, 1.5, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6];
const audio = new AudioController();

const instruments = [];
for (let i = 0; i < 16; i++) {
    instruments.push(new Wave());
}
const instrumentSelectorOptions = [];

let instrument = instruments[0];
let instrumentIndex = 0;

let waveformGenerator = instrument.getFrameCallback(440);
let currentKey = null;

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
    for (let i = 0; i < instruments.length; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.innerText = `${i+1} - ${instruments[i].name}`;
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
        const code = "{\n" + instruments.map((instrument) => {
            return `${instrument.getLuaCode()},`;
        }).join("\n") + "\n}";
        codeOutput.value = code;
    });

    instrumentSelector.addEventListener('change', () => {
        instrumentIndex = parseInt(instrumentSelector.value);
        instrument = instruments[instrumentIndex];
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
