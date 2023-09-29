export const waveType = {
    SQUARE: 1,
    TRIANGLE: 2,
    SINE: 3,
    NOISE: 4,
}

export class Wave {
    constructor() {
        this.waveType = waveType.SQUARE;
        this.transpose = 0;
        this.slideStep = 0;
        this.decayTo = 0;
        this.decaySpeed = 16;
        this.phaseMin = 16;
        this.phaseMax = 16;
        this.phasePeriod = 16;
        this.vibratoDepth = 0;
        this.vibratoPeriod = 16;
        this.harmonics = [1, 0, 0, 0, 0, 0, 0, 0];
    }
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
        let phaseStmt = '';
        let waveStmt;
        let waveExpr;
        let usePhase = false;
        if (this.waveType == waveType.NOISE) {
            waveStmt = "poke4(a*2+4+i,0)"
        } else {
            switch (this.waveType) {
                case waveType.SQUARE:
                    waveExpr = "i<p and 7.5 or -7.5"
                    usePhase = true;
                    break;
                case waveType.TRIANGLE:
                    waveExpr = "15*(i<p and i/p or (32-i)/(32-p))-7.5";
                    usePhase = true;
                    break;
                case waveType.SINE:
                    waveExpr = "7.5*math.sin(math.pi*i/16)";
                    break;
                default:
                    throw new Exception("Unknown wave type");
            }

            if (usePhase) {
                const phaseCentre = (this.phaseMin + this.phaseMax) / 2;
                const phaseAmplitude = (this.phaseMax - this.phaseMin) / 2;
                if (phaseAmplitude > 0) {
                    phaseStmt = `local p=${phaseCentre}-${phaseAmplitude}*math.cos(t*2*math.pi/${this.phasePeriod})`;
                } else {
                    phaseStmt = `local p=${phaseCentre}`;
                }
            }

            waveStmt = `local r=${waveExpr}
        poke4(a*2+4+i,7.5+r)`
        }


return `function (c,v,f,t)
    local a=0xff9c+c*18
    poke(a,f&255)
    poke(a+1,(v<<4)+(f>>8))
    ${phaseStmt}
    for i=0,31 do
        ${waveStmt}
    end
end
`;
    }
}
