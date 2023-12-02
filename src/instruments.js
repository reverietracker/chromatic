import { Model, fields } from 'catwalk';

export const waveType = {
    SQUARE: 1,
    TRIANGLE: 2,
    SINE: 3,
    NOISE: 4,
}

export class Wave extends Model([
    new fields.IntegerField('waveType', {default: waveType.SQUARE}),
    new fields.ValueField('name', {default: ""}),
    new fields.IntegerField('transpose', {default: 0, min: -24, max: 24}),
    new fields.IntegerField('slideStep', {default: 0, min: -256, max: 256, label: "Pitch slide step"}),
    new fields.IntegerField('decayTo', {default: 0, min: 0, max: 15, label: "Decay to volume"}),
    new fields.IntegerField('decaySpeed', {default: 16, min: 0, max: 256}),
    new fields.IntegerField('phaseMin', {default: 16, min: 0, max: 32}),
    new fields.IntegerField('phaseMax', {default: 16, min: 0, max: 32}),
    new fields.IntegerField('phasePeriod', {default: 16, min: 0, max: 256}),
    new fields.IntegerField('vibratoDepth', {default: 0, min: 0, max: 256}),
    new fields.IntegerField('vibratoPeriod', {default: 16, min: 0, max: 256}),
    new fields.ListField(
        'harmonics',
        new fields.IntegerField('harmonic', {default: 0, min: 0, max: 1}),
        {length: 8, default: [1, 0, 0, 0, 0, 0, 0, 0]},
    ),
]) {
    getFrameCallback(originalFrequency) {
        const frequency = originalFrequency * 2**(this.transpose / 12);
        return (frame) => {
            const waveform = new Array(32);
            if (this.waveType == waveType.NOISE) {
                for (let i = 0; i < 32; i++) waveform[i] = 0;
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
                        throw new Exception("Unknown wave type");
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

            return {
                frequency: Math.min(Math.max(1, Math.round(finalFrequency)), 4095),
                volume: Math.max(this.decayTo, 15 - (frame * this.decaySpeed / 16)),
                waveform,
            };
        }
    }

    getLuaCode() {
        const modifierStatements = [];
        const waveStatements = [];

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
            modifierStatements.push(`  v=math.max(${this.decayTo}, 15-(t*${this.decaySpeed/16}))*v//15`);
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
                    throw new Exception("Unknown wave type");
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

return `function (c,v,f,t)
  -- ${this.name}
  local a=0xff9c+c*18
${modifierStatements.join('\n')}
  poke(a,f&255)
  poke(a+1,(v<<4)+(f>>8))
  for i=0,31 do
${waveStatements.join('\n')}
  end
end
`;
    }
}
