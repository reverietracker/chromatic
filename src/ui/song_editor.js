import { Container, NumberInput } from 'catwalk-ui';
import { Song } from "../models/song";
import { EditorState } from "../models/editor_state";

export class SongEditor extends Container {
    static components = {
        speedInput: NumberInput.forField(Song.fields.speed),
        lengthInput: NumberInput.forField(Song.fields.length),
    }
    constructor(props) {
        super(props);
        const OctaveInput = NumberInput.forField(EditorState.fields.octave);
        this.octaveInput = new OctaveInput();
        this.editorState = null;
    }
    trackEditorState(editorState) {
        this.editorState = editorState;
        this.octaveInput.trackModel(editorState);
    }
    createNode() {
        return (
            <div class="section">
                {this.speedInput.labelNode} {this.speedInput}
                {this.lengthInput.labelNode} {this.lengthInput}
                {this.octaveInput.labelNode} {this.octaveInput}
            </div>
        );
    }
}
