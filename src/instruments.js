const waveType = {
    SQUARE: 1,
    TRIANGLE: 2,
    SINE: 3,
}

export class Wave {
    constructor() {
        this.waveType = waveType.SQUARE;
        this.decayTo = 0;
        this.decaySpeed = 16;
        this.phase = 16;
    }
    getFrameCallback(frequency) {
        let waveform;
        switch (this.waveType) {
            case waveType.SQUARE:
                waveform = Array.from(new Array(32), (x, i) => i < this.phase ? 15 : 0);
                break;
            case waveType.TRIANGLE:
                waveform = Array.from(new Array(32), (x, i) => i < this.phase ? Math.round(15 * i / this.phase) : Math.round(15 * (32 - i) / (32 - this.phase)));
                break;
            default:  // SINE
                waveform = Array.from(new Array(32), (x, i) => Math.round(7.5 + 7.5 * Math.sin(Math.PI * i / 16)));
                break;
        }
        return (frame) => {
            return {
                frequency,
                volume: Math.max(this.decayTo, 15 - (frame * this.decaySpeed / 16)),
                waveform,
            };
        }
    }
}
