import "./chromatic.css";

import { AudioController } from "./audio";
import { Wave, waveType } from "./instruments";
import { Scope } from "./scope";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const KEY_POSITIONS = [0, 0.5, 1, 1.5, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6];
const audio = new AudioController();

const instrument = new Wave();
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
    const initControl = (inputId, param, onchange) => {
        const elem = document.getElementById(inputId);
        instrument[param] = parseInt(elem.value);
        elem.addEventListener('input', () => {
            instrument[param] = parseInt(elem.value);
            waveformGenerator = instrument.getFrameCallback(440);
            drawScopeAtScrubPosition();
            if (onchange) onchange(elem.value);
        });
    }
    initControl("wave-type", "waveType", (val) => {
        if (val == waveType.SINE) {
            phaseFieldset.setAttribute('disabled', 'true');
        } else {
            phaseFieldset.removeAttribute('disabled');
        }
    });
    initControl("transpose", "transpose");
    initControl("phase-min", "phaseMin");
    initControl("phase-max", "phaseMax");
    initControl("phase-period", "phasePeriod");
    initControl("decay-to", "decayTo");
    initControl("decay-speed", "decaySpeed");
    initControl("vibrato-depth", "vibratoDepth");
    initControl("vibrato-period", "vibratoPeriod");

    waveformGenerator = instrument.getFrameCallback(440);
    drawScopeAtScrubPosition();

    audio.on('frame', (frameData) => {
        scope.drawFrame(frameData);
    });
    audio.on('stop', () => {
        drawScopeAtScrubPosition();
    })
});
