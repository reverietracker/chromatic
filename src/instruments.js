export const waveType = {
    SQUARE: 1,
    TRIANGLE: 2,
    SINE: 3,
}

export class Wave {
    constructor() {
        this.waveType = waveType.SQUARE;
        this.decayTo = 0;
        this.decaySpeed = 16;
        this.phaseMin = 16;
        this.phaseMax = 16;
        this.phasePeriod = 16;
    }
    getFrameCallback(frequency) {
        return (frame) => {
            const phaseCentre = (this.phaseMin + this.phaseMax) / 2;
            const phaseAmplitude = (this.phaseMax - this.phaseMin) / 2;
            const phase = phaseCentre - phaseAmplitude * Math.cos(frame * 2 * Math.PI / this.phasePeriod);
            let waveform;
            switch (this.waveType) {
                case waveType.SQUARE:
                    waveform = Array.from(new Array(32), (x, i) => i < phase ? 15 : 0);
                    break;
                case waveType.TRIANGLE:
                    waveform = Array.from(new Array(32), (x, i) => i < phase ? Math.round(15 * i / phase) : Math.round(15 * (32 - i) / (32 - phase)));
                    break;
                default:  // SINE
                    waveform = Array.from(new Array(32), (x, i) => Math.round(7.5 + 7.5 * Math.sin(Math.PI * i / 16)));
                    break;
            }
            return {
                frequency,
                volume: Math.max(this.decayTo, 15 - (frame * this.decaySpeed / 16)),
                waveform,
            };
        }
    }
}
