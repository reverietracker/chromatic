import { Component, Container, Fieldset, InputList, NumberInput, RangeInput, SelectInput, TextInput } from 'catwalk-ui';

import { Ornament } from "../models/ornament";


class PitchesPanel extends InputList.forField(Ornament.fields.pitches, {
    elementInputClass: NumberInput.forField(Ornament.fields.pitches.subfield),
}) {
    createNode() {
        const ul = super.createNode();
        ul.id = "pitches";
        return (
            <fieldset>
                <legend>Pitches</legend>
                {ul}
            </fieldset>
        );
    }
}


class OrnamentEditor extends Container {
    static components = {
        pitchesPanel: PitchesPanel,
    };

    constructor(audio) {
        super();
        this.audio = audio;
    }

    createNode() {
        const node = (
            <div class="section">
                {this.pitchesPanel}
            </div>
        );

        return node;
    }
}

export class OrnamentPanel extends Component {
    constructor(audio) {
        super();
        this.ornamentEditor = new OrnamentEditor(audio);
    }

    createNode() {
        const node = (
            <div class="modal-panel-positioner">
                <div class="modal-panel">
                    <div class="toolbar">
                        <label for="ornament">Ornaments</label> <select id="ornament"></select>
                        <button class="close">Close</button>
                    </div>
                    {this.ornamentEditor}
                </div>
            </div>
        );
        this.modal = node.querySelector(".modal-panel");
        this.ornamentSelector = node.querySelector("#ornament");
        this.ornamentSelector.addEventListener('change', () => {
            const ornamentIndex = parseInt(this.ornamentSelector.value);
            const ornament = this.model.ornaments[ornamentIndex];
            this.ornamentEditor.trackModel(ornament);
        });
        node.querySelector(".close").addEventListener('click', () => {
            this.close();
        });
        this.close();

        return node;
    }

    open() {
        this.modal.style.display = 'block';
    }
    close() {
        this.modal.style.display = 'none';
    }

    trackModel(song) {
        super.trackModel(song);
        this.ornamentEditor.trackModel(song.ornaments[1]);

        this.ornamentSelector.replaceChildren();
        for (let i = 1; i < song.ornaments.length; i++) {
            const ornament = song.ornaments[i];
            const option = document.createElement('option');
            option.value = i;
            option.innerText = `${i}`;
            this.ornamentSelector.appendChild(option);
        }
    }
}
