import { saveSync } from 'save-file';
import fileDialog from 'file-dialog';

import "./chromatic.css";

import { AudioController } from "./audio/controller";
import { EditorState } from "./engines/chromatic/models/editor_state";
import { Song } from "./engines/chromatic/models/song";
import { Menu } from "./ui/menu";
import { InstrumentPanel } from "./engines/chromatic/ui/instrument_editor";
import { OrnamentPanel } from "./engines/chromatic/ui/ornament_editor";
import { PatternGrid } from './ui/pattern_grid';
import { SongEditor } from './ui/song_editor';

const audio = new AudioController();

let song;
const editorState = new EditorState();

const instrumentPanel = new InstrumentPanel(audio);
document.body.appendChild(instrumentPanel.node);
const ornamentPanel = new OrnamentPanel(audio);
document.body.appendChild(ornamentPanel.node);
const songEditor = new SongEditor();
document.body.appendChild(songEditor.node);
songEditor.trackEditorState(editorState);
songEditor.trackAudio(audio);

const menu = new Menu([
    {label: "Open", action: () => {
        fileDialog().then(files => {
            files[0].text().then(text => {
                const newSong = Song.fromJSON(text);
                openSong(newSong);
            });
        });
    }},
    {label: "Save", action: () => {
        saveSync(song.toJSON(), "song.cmt");
    }},
    {label: "Export", action: () => {
        saveSync(song.getLuaCode(), "song.lua");
    }},
    {label: "Instruments", action: () => {
        instrumentPanel.open();
    }},
    {label: "Ornaments", action: () => {
        ornamentPanel.open();
    }},
    {label: "Stop", action: () => {
        audio.stop();
    }},
    {label: "Play Pattern", action: () => {
        audio.playPattern(song.patterns[editorState.pattern]);
    }},
    {label: "Play All", action: () => {
        audio.playSong(0);
    }},
    {label: "Play From Position", action: () => {
        audio.playSong(editorState.selectedPosition);
    }},
]);
document.querySelector("#menu-container").prepend(menu.node);

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
    ornamentPanel.trackModel(song);
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
    openSong(new Song());
});
