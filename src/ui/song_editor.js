import { Container, NumberInput } from 'catwalk-ui';
import { Song } from "../models/song";

export class SongEditor extends Container {
    static components = {
        speedInput: NumberInput.forField(Song.fields.speed),
    }
    createNode() {
        return (
            <div class="section">
                {this.speedInput.labelNode} {this.speedInput}
            </div>
        );
    }
}
