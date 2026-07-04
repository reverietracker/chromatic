import { Component, Container, Fieldset, InputList, NumberInput, RangeInput, SelectInput, TextInput } from 'catwalk-ui';

import { Modal } from "../../../ui/modal";
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

export class OrnamentPanel extends Modal {
    constructor(audio) {
        super();
        this.ornamentEditor = new OrnamentEditor(audio);
    }

    createBody() {
        const node = (
            <div>
                <div class="toolbar">
                    <label for="ornament">Ornaments</label> <select id="ornament"></select>
                    {this.closeButton}
                </div>
                {this.ornamentEditor}
            </div>
        );
        this.ornamentSelector = node.querySelector("#ornament");
        this.ornamentSelector.addEventListener('change', () => {
            const ornamentIndex = parseInt(this.ornamentSelector.value);
            const ornament = this.model.ornaments[ornamentIndex];
            this.ornamentEditor.trackModel(ornament);
        });

        return node;
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
