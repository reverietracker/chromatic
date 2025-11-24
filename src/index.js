import { saveSync } from 'save-file';
import fileDialog from 'file-dialog';

import "./chromatic.css";

import { AudioController } from "./audio/controller";
import { EditorState } from "./models/editor_state";
import { Song } from "./models/song";
import { InstrumentPanel } from "./ui/instrument_editor";
import { PatternGrid } from './ui/pattern_grid';
import { SongEditor } from './ui/song_editor';

const audio = new AudioController();

let song;
const editorState = new EditorState();

const instrumentPanel = new InstrumentPanel(audio);
document.querySelector(".instrument-panel-positioner").appendChild(instrumentPanel.node);
const songEditor = new SongEditor(audio);
document.body.appendChild(songEditor.node);
songEditor.trackEditorState(editorState);

const patternGrid = new PatternGrid(audio);
document.body.appendChild(patternGrid.node);
patternGrid.trackEditorState(editorState);
editorState.on("changePattern", (patternIndex) => {
    if (song) {
        patternGrid.trackModel(song.patterns[patternIndex]);
    }
});

const openSong = (newSong) => {
    song = newSong;
    instrumentPanel.trackModel(song);
    songEditor.trackModel(song);
    audio.song = song;
    editorState.pattern = 0;
    patternGrid.trackModel(song.patterns[editorState.pattern]);
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

    const playPatternButton = document.getElementById("play-pattern");
    playPatternButton.addEventListener('click', () => {
        audio.playPattern(song.patterns[editorState.pattern]);
    });

    const stopButton = document.getElementById("stop");
    stopButton.addEventListener('click', () => {
        audio.stop();
    });

    openSong(new Song());
});
