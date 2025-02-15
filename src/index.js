import { saveSync } from 'save-file';
import fileDialog from 'file-dialog';

import "./chromatic.css";

import { AudioController } from "./audio";
import { Song } from "./models/song";
import { InstrumentPanel } from "./ui/instrument_editor";

const audio = new AudioController();

let song;

const instrumentPanel = new InstrumentPanel(audio);
document.querySelector(".instrument-panel-positioner").appendChild(instrumentPanel.node);

const openSong = (newSong) => {
    song = newSong;
    instrumentPanel.trackModel(song);
}

document.addEventListener('DOMContentLoaded', () => {
    const masterVolumeControl = document.getElementById("master-volume");
    audio.setVolume(masterVolumeControl.value / 1000);
    masterVolumeControl.addEventListener('input', () => {
        audio.setVolume(masterVolumeControl.value / 1000);
    })

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

    const openInstrumentEditorButton = document.getElementById("open-instrument-panel");
    const instrumentEditorContainer = document.querySelector(".instrument-panel");
    instrumentEditorContainer.style.display = 'none';
    openInstrumentEditorButton.addEventListener('click', () => {
        instrumentEditorContainer.style.display = 'block';
    });
    const closeInstrumentEditorButton = document.getElementById("close-instrument-panel");
    closeInstrumentEditorButton.addEventListener('click', () => {
        instrumentEditorContainer.style.display = 'none';
    });

    openSong(new Song());
});
