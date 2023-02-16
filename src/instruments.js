const waveType = {
    SQUARE: 1,
    SAWTOOTH: 2,
    SINE: 3,
}

export class Wave {
    constructor() {
        this.waveType = waveType.SQUARE;
        this.decayTo = 0;
    }
    getFrameCallback(frequency) {
        let waveform;
        switch (this.waveType) {
            case waveType.SQUARE:
                waveform = Array.from(new Array(32), (x, i) => i < 16 ? 15 : 0);
                break;
            case waveType.SAWTOOTH:
                waveform = Array.from(new Array(32), (x, i) => 15 - Math.floor(i/2));
                break;
            default:  // SINE
                waveform = Array.from(new Array(32), (x, i) => Math.round(7.5 + 7.5 * Math.sin(Math.PI * i / 16)));
                break;
        }
        return (frame) => {
            return {
                frequency,
                volume: Math.max(this.decayTo, 15 - frame),
                waveform,
            };
        }
    }
}
