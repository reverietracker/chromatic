export const waveType = {
    SQUARE: 1,
    TRIANGLE: 2,
    SINE: 3,
}

export class Wave {
    constructor() {
        this.waveType = waveType.SQUARE;
        this.transpose = 0;
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
                default:  // SINE
                    waveFunc = i => 7.5 * Math.sin(Math.PI * i / 16);
                    break;
            }
            const waveform = new Array(32);
            for (let i = 0; i < 32; i++) {
                let tot = 0;
                for (let h = 0; h < 8; h++) {
                    const harmonic = this.harmonics[h];
                    tot += harmonic * waveFunc(i * (h + 1) % 32);
                }
                waveform[i] = Math.min(Math.max(0, Math.round(7.5 + tot)), 15);
            }

            return {
                frequency: frequency + this.vibratoDepth * Math.sin(frame * 2 * Math.PI / this.vibratoPeriod),
                volume: Math.max(this.decayTo, 15 - (frame * this.decaySpeed / 16)),
                waveform,
            };
        }
    }
}
