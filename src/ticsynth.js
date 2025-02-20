export class TICSynth {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;

        this.frequency = 440;
        this.volume = 0;
        this.waveform = [
            15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ];
        this.waveformIsNoise = false;
        this.frameCallback = null;
        this.onFrame = null;
        this.frameNumber = 0;

        this.samplesPerFrame = sampleRate / 60;
        this.samplesToNextFrame = 0;
        this.samplesToNextWaveformElement = 0;
        this.samplesPerWaveformElement = 0;
        this.waveformPtr = 0;
        this.level = 0;
    }
    generate(audioData) {
        let samplePtr = 0;
        while (samplePtr < audioData.length) {
            if (this.samplesToNextFrame <= 0) {
                if (this.frameCallback) {
                    let frameData = this.frameCallback(this.frameNumber);
                    if (this.onFrame) this.onFrame(frameData);
                    this.frameNumber++;
                    this.waveform = frameData[0].waveform;
                    let waveformIsNoise = true;
                    for (let i = 0; i < 32; i++) {
                        if (this.waveform[i] != 0) {
                            waveformIsNoise = false;
                            break;
                        }
                    }
                    this.waveformIsNoise = waveformIsNoise;
                    this.volume = frameData[0].volume;
                    this.frequency = Math.floor(frameData[0].frequency);
                } else {
                    this.volume = 0;
                }
                this.samplesPerWaveformElement = this.sampleRate / this.frequency / 32;
                if (this.waveformIsNoise) {
                    // fudge factor to match observed behaviour of TIC-80 -
                    // apparently noise values are only picked half as often
                    this.samplesPerWaveformElement *= 2;
                }
                this.samplesToNextFrame += this.samplesPerFrame;
            }
            if (this.samplesToNextWaveformElement <= 0) {
                if (this.waveformIsNoise) {
                    this.level = Math.random() >= 0.5 ? 15 : 0;
                } else {
                    this.level = this.waveform[this.waveformPtr];
                }
                this.waveformPtr = (this.waveformPtr + 1) % 32;
                this.samplesToNextWaveformElement += this.samplesPerWaveformElement;
            }
            let finalLevel = (this.level - 7.5) / 7.5 * this.volume / 15;
            audioData[samplePtr++] = finalLevel;
            this.samplesToNextWaveformElement--;
            this.samplesToNextFrame--;
        }
    }
}