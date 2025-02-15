import { Container, Fieldset, InputList, NumberInput, RangeInput, SelectInput, TextInput } from 'catwalk-ui';

import { Wave, waveType } from "../models/instruments";
import { Scope } from "./scope";


class PhaseFieldset extends Fieldset.withOptions({legend: "Phase"}) {
    static components = {
        phaseMinInput: NumberInput.forField(Wave.fields.phaseMin, {label: "Min"}),
        phaseMaxInput: NumberInput.forField(Wave.fields.phaseMax, {label: "Max"}),
        phasePeriodInput: NumberInput.forField(Wave.fields.phasePeriod, {label: "Period"}),
    }
}

class EnvelopeFieldset extends Fieldset.withOptions({legend: "Envelope"}) {
    static components = {
        decaySpeedInput: NumberInput.forField(Wave.fields.decaySpeed),
        decayToInput: NumberInput.forField(Wave.fields.decayTo),
    }
}

class VibratoFieldset extends Fieldset.withOptions({legend: "Vibrato"}) {
    static components = {
        vibratoDepthInput: NumberInput.forField(Wave.fields.vibratoDepth, {label: "Depth"}),
        vibratoPeriodInput: NumberInput.forField(Wave.fields.vibratoPeriod, {label: "Period"}),
    }
}

class HarmonicsPanel extends InputList.forField(Wave.fields.harmonics, {
    elementInputClass: NumberInput.forField(Wave.fields.harmonics.subfield, {attributes: {step: 0.1}}),
}) {
    createNode() {
        const ul = super.createNode();
        ul.id = "harmonics";
        return (
            <fieldset>
                <legend>Harmonics</legend>
                {ul}
            </fieldset>
        );
    }
}

export class InstrumentEditor extends Container {
    static components = {
        waveTypeInput: SelectInput.forField(Wave.fields.waveType, {label: "Wave type"}),
        nameInput: TextInput.forField(Wave.fields.name, {label: "Instrument name"}),
        transposeInput: NumberInput.forField(Wave.fields.transpose),
        slideStepInput: NumberInput.forField(Wave.fields.slideStep),
        phaseFieldset: PhaseFieldset,
        envelopeFieldset: EnvelopeFieldset,
        vibratoFieldset: VibratoFieldset,
        harmonicsPanel: HarmonicsPanel,
        scope: Scope,
        scrubControl: RangeInput.withOptions({id: "scrub", label: "Time", min: 0, max: 60, value: 0}),
    }

    constructor() {
        super();
        this.scope.scrubControlNode = this.scrubControl.node;

        this.trackField(Wave.fields.waveType, (wt) => {
            if (wt == waveType.NOISE || wt == waveType.SINE || wt == waveType.SAMPLE) {
                this.phaseFieldset.node.setAttribute('disabled', 'true');
            } else {
                this.phaseFieldset.node.removeAttribute('disabled');
            }

            if (wt == waveType.NOISE || wt == waveType.SAMPLE) {
                this.harmonicsPanel.node.setAttribute('disabled', 'true');
            } else {
                this.harmonicsPanel.node.removeAttribute('disabled');
            }

            if (wt == waveType.SAMPLE) {
                this.envelopeFieldset.node.setAttribute('disabled', 'true');
                this.vibratoFieldset.node.setAttribute('disabled', 'true');
                this.slideStepInput.node.setAttribute('disabled', 'true');
                this.transposeInput.node.setAttribute('disabled', 'true');
            } else {
                this.envelopeFieldset.node.removeAttribute('disabled');
                this.vibratoFieldset.node.removeAttribute('disabled');
                this.slideStepInput.node.removeAttribute('disabled');
                this.transposeInput.node.removeAttribute('disabled');
            }
        });
    }

    createNode() {
        return (
            <div>
                <div class="section">
                    <div class="left-col">
                        {this.nameInput.labelNode}
                        {this.nameInput}
                        {this.scope}
                    </div>
                    <div id="parameters">
                        <div>
                            {this.waveTypeInput.labelNode}
                            {this.waveTypeInput}
                        </div>
                        <div>
                            {this.transposeInput.labelNode}
                            {this.transposeInput}
                        </div>
                        <div>
                            {this.slideStepInput.labelNode}
                            {this.slideStepInput}
                        </div>
                        {this.phaseFieldset}
                        {this.envelopeFieldset}
                        {this.vibratoFieldset}
                        <div class="section">
                            {this.harmonicsPanel}
                        </div>
                    </div>
                </div>
                <div class="section">
                    {this.scrubControl.labelNode}
                    {this.scrubControl}
                    <span id="scrub-value"></span>
                </div>
                <ul id="keyboard"></ul>
            </div>
        );
    }
}
