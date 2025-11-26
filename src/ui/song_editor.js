import { Container, NumberInput } from 'catwalk-ui';
import { Song } from "../models/song";
import { EditorState } from "../models/editor_state";
import { PositionList } from './position_list';

export class SongEditor extends Container {
    static components = {
        speedInput: NumberInput.forField(Song.fields.speed),
        lengthInput: NumberInput.forField(Song.fields.length),
        positionList: PositionList,
    };
    constructor(props) {
        super(props);
        const OctaveInput = NumberInput.forField(EditorState.fields.octave);
        const PatternInput = NumberInput.forField(EditorState.fields.pattern);
        this.octaveInput = new OctaveInput();
        this.patternInput = new PatternInput();
        this.editorState = null;
    }
    trackEditorState(editorState) {
        this.editorState = editorState;
        this.octaveInput.trackModel(editorState);
        this.patternInput.trackModel(editorState);
    }
    createNode() {
        return (
            <div class="section">
                {this.positionList}
                {this.speedInput.labelNode} {this.speedInput}
                {this.lengthInput.labelNode} {this.lengthInput}
                {this.octaveInput.labelNode} {this.octaveInput}
                {this.patternInput.labelNode} {this.patternInput}
            </div>
        );
    }
}
