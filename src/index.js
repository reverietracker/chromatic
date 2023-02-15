import "./chromatic.css";

import { AudioController } from "./audio";
import { SquareWave } from "./instruments";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const KEY_POSITIONS = [0, 0.5, 1, 1.5, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6];
const audioController = new AudioController();

const waveform = new SquareWave();
let currentKey = null;

class Key {
    constructor(container, oct, n){
        const noteVal = (oct*12 + n) - 57;
        const noteName = NOTE_NAMES[n] + oct;
        this.frequency = 440 * 2**(noteVal/12);
        this.button = document.createElement('button');
        this.button.className = 'key';
        if ([1, 3, 6, 8, 10].includes(n)) {
            this.button.classList.add('black');
        } else {
            this.button.classList.add('white');
        }
        this.button.style.left = (((oct-3) * 7 + KEY_POSITIONS[n]) * 32) + 'px';
        this.button.innerText = noteName;
        container.appendChild(this.button);
        this.button.addEventListener("mousedown", () => {
            this.play();
        });
    }
    play() {
        currentKey = this;
        this.button.classList.add('active');
        const frameCallback = waveform.getFrameCallback(this.frequency);
        audioController.play(frameCallback);
    }
    release() {
        this.button.classList.remove('active');
        audioController.stop();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const masterVolumeControl = document.getElementById("master-volume");
    audioController.setVolume(masterVolumeControl.value / 1000);
    masterVolumeControl.addEventListener('change', () => {
        audioController.setVolume(masterVolumeControl.value / 1000);
    })

    const keyboard = document.getElementById("keyboard");
    for (let oct=3; oct<6; oct++) {
        for (let n=0; n<12; n++) {
            new Key(keyboard, oct, n);
        }
    }
    window.addEventListener('mouseup', () => {
        if (currentKey) currentKey.release();
    });
});
