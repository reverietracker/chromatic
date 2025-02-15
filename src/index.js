import { saveSync } from 'save-file';
import fileDialog from 'file-dialog';

import "./chromatic.css";

import { AudioController } from "./audio";
import { Song } from "./models/song";
import { InstrumentEditor } from "./ui/instrument_editor";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const KEY_POSITIONS = [0, 0.5, 1, 1.5, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6];
const audio = new AudioController();

let song, instrument;

let currentKey = null;


const instrumentEditor = new InstrumentEditor();
document.querySelector(".instrument-editor").appendChild(instrumentEditor.node);
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

    const openInstrumentEditorButton = document.getElementById("open-instrument-editor");
    const instrumentEditorContainer = document.querySelector(".instrument-editor");
    instrumentEditorContainer.style.display = 'none';
    openInstrumentEditorButton.addEventListener('click', () => {
        instrumentEditorContainer.style.display = 'block';
    });
    const closeInstrumentEditorButton = document.getElementById("close-instrument-editor");
    closeInstrumentEditorButton.addEventListener('click', () => {
        instrumentEditorContainer.style.display = 'none';
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
