import { AudioController } from "./audio";
import { SquareWave } from "./instruments";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const audioController = new AudioController();

const waveform = new SquareWave();

class Key {
    constructor(container, noteVal, noteName){
        this.frequency = 440 * 2**(noteVal/12);
        const button = document.createElement('button');
        button.innerText = noteName;
        container.appendChild(button);
        button.addEventListener("mousedown", () => {
            const frameCallback = waveform.getFrameCallback(this.frequency);
            audioController.play(frameCallback);
        });
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
            const noteVal = (oct*12 + n) - 57;
            const noteName = NOTE_NAMES[n] + oct;
            new Key(keyboard, noteVal, noteName);
        }
    }
    window.addEventListener('mouseup', () => {
        audioController.stop();
    });
});
