import { Container, NumberInput } from 'catwalk-ui';
import { Song } from "../models/song";
import { EditorState } from "../models/editor_state";
import { Pattern } from "../models/pattern";
import { PositionList } from './position_list';

export class SongEditor extends Container {
    static components = {
        speedInput: NumberInput.forField(Song.fields.speed),
        lengthInput: NumberInput.forField(Song.fields.length, {label: "Song length"}),
        positionList: PositionList,
    };
    constructor(props) {
        super(props);
        const OctaveInput = NumberInput.forField(EditorState.fields.octave);
        const PatternInput = NumberInput.forField(EditorState.fields.pattern);
        const PatternLengthInput = NumberInput.forField(Pattern.fields.length, {label: "Pattern length"});
        this.octaveInput = new OctaveInput();
        this.patternInput = new PatternInput();
        this.patternLengthInput = new PatternLengthInput();
        this.editorState = null;

        this.changePatternHandler = (newPatternIndex) => {
            if (this.model) {
                const pattern = this.model.patterns[newPatternIndex];
                this.patternLengthInput.trackModel(pattern);
            }
        };
    }
    trackModel(model) {
        super.trackModel(model);
        if (this.editorState) {
            this.changePatternHandler(this.editorState.pattern);
        }
    }
    trackEditorState(editorState) {
        if (this.editorState) {
            this.editorState.removeListener("changePattern", this.changePatternHandler);
        }
        this.editorState = editorState;
        this.octaveInput.trackModel(editorState);
        this.patternInput.trackModel(editorState);
        this.positionList.trackEditorState(editorState);
        editorState.on("changePattern", this.changePatternHandler);
        this.changePatternHandler(editorState.pattern);
    }
    trackAudio(audio) {
        this.positionList.trackAudio(audio);
    }
    createNode() {
        return (
            <div class="section">
                {this.speedInput.labelNode} {this.speedInput}
                {this.lengthInput.labelNode} {this.lengthInput}
                {this.positionList}
                {this.patternInput.labelNode} {this.patternInput}
                {this.patternLengthInput.labelNode} {this.patternLengthInput}
                {this.octaveInput.labelNode} {this.octaveInput}
            </div>
        );
    }
}
