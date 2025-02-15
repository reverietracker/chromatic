import { saveSync } from 'save-file';
import fileDialog from 'file-dialog';

import "./chromatic.css";

import { AudioController } from "./audio";
import { Song } from "./models/song";
import { InstrumentEditor } from "./ui/instrument_editor";

const audio = new AudioController();

let song;

const instrumentEditor = new InstrumentEditor(audio);
document.querySelector(".instrument-editor").appendChild(instrumentEditor.node);
const instrumentSelector = document.getElementById("instrument");

const openSong = (newSong) => {
    song = newSong;
    instrumentEditor.trackModel(song.instruments[1]);

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

document.addEventListener('DOMContentLoaded', () => {
    const masterVolumeControl = document.getElementById("master-volume");
    audio.setVolume(masterVolumeControl.value / 1000);
    masterVolumeControl.addEventListener('input', () => {
        audio.setVolume(masterVolumeControl.value / 1000);
    })

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
        const instrument = song.instruments[instrumentIndex];
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
