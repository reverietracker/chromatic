import { Model, fields } from 'catwalk';
import { WaveFile } from 'wavefile';

import { normalizeWave, makeFrame } from '../util/sample.js';
import { MAX_NOTE_NUM } from '../defs.js';

export const waveType = {
    SQUARE: 1,
    TRIANGLE: 2,
    SINE: 3,
    NOISE: 4,
    SAMPLE: 5,
}

export class Wave extends Model([
    new fields.EnumField('waveType', {choices: [
        [waveType.SQUARE, "Square"],
        [waveType.TRIANGLE, "Triangle"],
        [waveType.SINE, "Sine"],
        [waveType.NOISE, "Noise"],
        [waveType.SAMPLE, "Sample"],
    ], default: waveType.SQUARE}),
    new fields.ValueField('name', {default: ""}),
    new fields.IntegerField('transpose', {default: 0, min: -24, max: 24}),
    new fields.IntegerField('slideStep', {default: 0, min: -256, max: 256, label: "Pitch slide step"}),
    new fields.IntegerField('initialVolume', {default: 15, min: 0, max: 15, label: "Initial volume"}),
    new fields.IntegerField('decayTo', {default: 0, min: 0, max: 15, label: "Final volume"}),
    new fields.IntegerField('decaySpeed', {default: 16, min: 0, max: 256}),
    new fields.IntegerField('phaseMin', {default: 16, min: 0, max: 32}),
    new fields.IntegerField('phaseMax', {default: 16, min: 0, max: 32}),
    new fields.IntegerField('phasePeriod', {default: 16, min: 0, max: 256}),
    new fields.IntegerField('vibratoDepth', {default: 0, min: 0, max: 256}),
    new fields.IntegerField('vibratoPeriod', {default: 16, min: 0, max: 256}),
    new fields.ListField(
        'harmonics',
        new fields.NumberField('harmonic', {default: 0, min: 0, max: 1}),
        {length: 8, default: [1, 0, 0, 0, 0, 0, 0, 0]},
    ),
    new fields.ValueField('sampleWaveforms', {default: []}),
    new fields.ValueField('sampleVolumes', {default: []}),
    new fields.ValueField('sampleFrequencies', {default: []}),
    new fields.IntegerField('sampleRepeatFrom', {default: 0, min: 0}),
    new fields.IntegerField('sampleRepeatLength', {default: 0, min: 0}),
    new fields.IntegerField('sampleBaseNote', {default: 27, min: 1, max: MAX_NOTE_NUM}),
]) {
    loadSampleFromWavBuffer(arrayBuffer) {

        const buffer = new Uint8Array(arrayBuffer);
        const wav = new WaveFile(buffer);
        const samples = normalizeWave(wav);

        const sampleRate = wav.fmt.sampleRate;
        const blockStep = Math.floor(sampleRate / 60);
        const blockSize = blockStep * 2;
        const frames = [];

        // take slices of samples of size blockSize, stepping by blockStep
        for (let i = 0; i < samples.length; i += blockStep) {
            let block = samples.slice(i, i + blockSize);
            // exit when block size is less than blockStep
            if (block.length < blockStep) {
                break;
            }
            frames.push(makeFrame(block, sampleRate));
        }
        const sampleWaveforms = [];
        const sampleVolumes = [];
        const sampleFrequencies = [];

        for (const frame of frames) {
            sampleWaveforms.push(frame.waveform.map((v) => String.fromCharCode(v + 65)).join(''));
            sampleVolumes.push(frame.volume);
            sampleFrequencies.push(frame.frequency);
        }

        this.sampleWaveforms = sampleWaveforms;
        this.sampleVolumes = sampleVolumes;
        this.sampleFrequencies = sampleFrequencies;
    }

    getFrameCallback(originalFrequency) {
        const frequency = originalFrequency * 2**(this.transpose / 12);
        return (frame) => {
            const waveform = new Array(32);
            if (this.waveType == waveType.NOISE) {
                for (let i = 0; i < 32; i++) waveform[i] = 0;
            } else if (this.waveType == waveType.SAMPLE) {

                let waveIndex;
                if (frame < this.sampleVolumes.length) {
                    waveIndex = frame;
                } else if (this.sampleRepeatFrom > 0) {
                    const indexWithinRepeat = (frame - this.sampleVolumes.length) % this.sampleRepeatLength;
                    waveIndex = this.sampleRepeatFrom + indexWithinRepeat;
                } else {
                    // sample has ended
                    return {
                        frequency: 440,
                        volume: 0,
                        waveform: [
                            15,15,15,15, 15,15,15,15, 15,15,15,15, 15,15,15,15,
                            0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
                        ],
                    };
                }
                const baseFreq = 440 * 2**((this.sampleBaseNote-33) / 12);
                const freqMultiplier = originalFrequency / baseFreq;

                const result = {
                    frequency: this.sampleFrequencies[waveIndex] * freqMultiplier,
                    volume: this.sampleVolumes[waveIndex],
                    waveform: this.sampleWaveforms[waveIndex].split('').map((c) => c.charCodeAt(0) - 65),
                };
                return result;
            } else {
                const phaseCentre = (this.phaseMin + this.phaseMax) / 2;
                const phaseAmplitude = (this.phaseMax - this.phaseMin) / 2;
                const phase = phaseCentre - phaseAmplitude * Math.cos(frame * 2 * Math.PI / this.phasePeriod);
                let waveFunc;
                switch (this.waveType) {
                    case waveType.SQUARE:
                        waveFunc = i => i < phase ? 7.5 : -7.5;
                        break;
                    case waveType.TRIANGLE:
                        waveFunc = i => i < phase ? 15 * i / phase - 7.5 : 15 * (32 - i) / (32 - phase) - 7.5;
                        break;
                    case waveType.SINE:
                        waveFunc = i => 7.5 * Math.sin(Math.PI * i / 16);
                        break;
                    default:
                        throw new Error("Unknown wave type");
                }
                for (let i = 0; i < 32; i++) {
                    let tot = 0;
                    for (let h = 0; h < 8; h++) {
                        const harmonic = this.harmonics[h];
                        tot += harmonic * waveFunc(i * (h + 1) % 32);
                    }
                    waveform[i] = Math.min(Math.max(0, Math.round(7.5 + tot)), 15);
                }
            }

            const finalFrequency = (
                frequency
                + this.vibratoDepth * Math.sin(frame * 2 * Math.PI / this.vibratoPeriod)
                + frame * this.slideStep / 16
            );

            const volume = Math.round(
                this.initialVolume >= this.decayTo ?
                Math.max(this.decayTo, this.initialVolume - (frame * this.decaySpeed / 16)) :
                Math.min(this.decayTo, this.initialVolume + (frame * this.decaySpeed / 16))
            );

            return {
                frequency: Math.min(Math.max(1, Math.round(finalFrequency)), 4095),
                volume: volume,
                waveform,
            };
        }
    }

    getLuaCode() {
        const modifierStatements = [];
        const waveStatements = [];

        if (this.waveType == waveType.SAMPLE) {
            const baseFreq = 440 * 2**((this.sampleBaseNote-33) / 12);
            const isLooped = this.sampleRepeatFrom > 0;

            modifierStatements.push(`  local waves={${this.sampleWaveforms.map((w) => `"${w}"`).join(',')}}`);
            modifierStatements.push(`  local vols={${this.sampleVolumes.join(',')}}`);
            modifierStatements.push(`  local freqs={${this.sampleFrequencies.join(',')}}`);
            if (isLooped) {
                modifierStatements.push(`  if (t>=${this.sampleVolumes.length}) then`);
                modifierStatements.push(`    t=(t-${this.sampleVolumes.length})%${this.sampleRepeatLength}+${this.sampleRepeatFrom}`);
                modifierStatements.push(`  end`);
                modifierStatements.push(`  local w=waves[t+1]`);
                modifierStatements.push(`  v=v*vols[t+1]//15`);
                modifierStatements.push(`  f=freqs[t+1]*f//${baseFreq}`);
            } else {
                modifierStatements.push(`  local w="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"`);
                modifierStatements.push(`  if (t<${this.sampleVolumes.length}) then`);
                modifierStatements.push(`    w=waves[t+1]`);
                modifierStatements.push(`    v=v*vols[t+1]//15`);
                modifierStatements.push(`    f=freqs[t+1]*f//${baseFreq}`);
                modifierStatements.push(`  else`);
                modifierStatements.push(`    v=0`);
                modifierStatements.push(`    f=440`);
                modifierStatements.push(`  end`);
            }
            waveStatements.push("    poke4(a*2+4+i,w:byte(i+1)-65)");
        } else {

            let usePhase = false;

            let clampFrequency = false;
            let clampWaveform = false;

            if (this.transpose != 0) {
                modifierStatements.push(`  f=f*${2**(this.transpose/12)}`);
                clampFrequency = true;
            }

            if (this.vibratoDepth > 0) {
                modifierStatements.push(`  f=f+${this.vibratoDepth}*math.sin(t*2*math.pi/${this.vibratoPeriod})`);
                clampFrequency = true;
            }

            if (this.slideStep != 0) {
                modifierStatements.push(`  f=f+t*${this.slideStep/16}`);
                clampFrequency = true;
            }

            if (clampFrequency) {
                modifierStatements.push(`  f=math.min(math.max(1,(f+0.5)//1),4095)`);
            }

            if (this.decaySpeed > 0) {
                if (this.initialVolume >= this.decayTo) {
                    modifierStatements.push(`  v=math.max(${this.decayTo},${this.initialVolume}-(t*${this.decaySpeed/16}))*v//15`);
                } else {
                    modifierStatements.push(`  v=math.min(${this.decayTo},${this.initialVolume}+(t*${this.decaySpeed/16}))*v//15`);
                }
            } else if (this.initialVolume != 15) {
                modifierStatements.push(`  v=${this.initialVolume}*v//15`);
            }

            if (this.waveType == waveType.NOISE) {
                waveStatements.push("    poke4(a*2+4+i,0)");
            } else {
                const waveTerms = [];

                switch (this.waveType) {
                    case waveType.SQUARE:
                        usePhase = true;
                        for (let h = 0; h < 8; h++) {
                            if (this.harmonics[h] == 0) continue;
                            let indexExpr;
                            if (h == 0) {
                                indexExpr = "i";
                            } else {
                                indexExpr = `(i*${h+1}%32)`;
                            }
                            const waveTerm = `${indexExpr}<p and 7.5 or -7.5`;
                            if (this.harmonics[h] == 1) {
                                waveTerms.push(waveTerm);
                            } else {
                                waveTerms.push(`${this.harmonics[h]}*(${waveTerm})`);
                                clampWaveform = true;
                            }
                        }
                        break;
                    case waveType.TRIANGLE:
                        usePhase = true;
                        for (let h = 0; h < 8; h++) {
                            if (this.harmonics[h] == 0) continue;
                            let indexExpr;
                            if (h == 0) {
                                indexExpr = "i";
                            } else {
                                indexExpr = `(i*${h+1}%32)`;
                            }
                            const waveTerm = `15*(${indexExpr}<p and ${indexExpr}/p or (32-${indexExpr})/(32-p))-7.5`
                            if (this.harmonics[h] == 1) {
                                waveTerms.push(waveTerm);
                            } else {
                                waveTerms.push(`${this.harmonics[h]}*(${waveTerm})`);
                                clampWaveform = true;
                            }
                        }
                        break;
                    case waveType.SINE:
                        for (let h = 0; h < 8; h++) {
                            if (this.harmonics[h] == 0) continue;
                            let indexExpr;
                            if (h == 0) {
                                indexExpr = "i";
                            } else {
                                indexExpr = `(i*${h+1}%32)`;
                            }
                            const waveTerm = `7.5*math.sin(math.pi*${indexExpr}/16)`;
                            if (this.harmonics[h] == 1) {
                                waveTerms.push(waveTerm);
                            } else {
                                waveTerms.push(`${this.harmonics[h]}*(${waveTerm})`);
                                if (this.harmonics[h] > 1) clampWaveform = true;
                            }
                        }
                        break;
                    default:
                        throw new Error("Unknown wave type");
                }

                if (usePhase) {
                    const phaseCentre = (this.phaseMin + this.phaseMax) / 2;
                    const phaseAmplitude = (this.phaseMax - this.phaseMin) / 2;
                    if (phaseAmplitude > 0) {
                        modifierStatements.push(`  local p=${phaseCentre}-${phaseAmplitude}*math.cos(t*2*math.pi/${this.phasePeriod})`);
                    } else {
                        modifierStatements.push(`  local p=${phaseCentre}`);
                    }
                }

                if (waveTerms.length == 1) {
                    if (clampWaveform) {
                        waveStatements.push(`    poke4(a*2+4+i,math.min(15,math.max(0,7.5+(${waveTerms[0]}))))`);
                    } else {
                        waveStatements.push(`    poke4(a*2+4+i,7.5+(${waveTerms[0]}))`);
                    }
                } else {
                    waveStatements.push(`    local r=0`);
                    for (let i = 0; i < waveTerms.length; i++) {
                        waveStatements.push(`    r=r+${waveTerms[i]}`);
                    }
                    waveStatements.push(`    poke4(a*2+4+i,math.min(15,math.max(0,7.5+r)))`);
                }
            }
        }

return `function (c,v,f,t)
  -- ${this.name}
  local a=0xff9c+c*18
${modifierStatements.join('\n')}
  poke(a,f//1&255)
  poke(a+1,(v<<4)+(f//1>>8))
  for i=0,31 do
${waveStatements.join('\n')}
  end
end
`;
    }
}
