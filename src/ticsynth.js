export class TICSynth {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;

        this.frequency = 440;
        this.volume = 0;
        this.waveform = [
            15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ];
        this.frameCallback = null;
        this.onFrame = null;
        this.frameNumber = 0;

        this.samplesPerFrame = sampleRate / 60;
        this.samplesToNextFrame = 0;
        this.samplesToNextWaveformElement = 0;
        this.samplesPerWaveformElement = 0;
        this.waveformPtr = 0;
    }
    generate(audioData) {
        let samplePtr = 0;
        let level = this.waveform[this.waveformPtr];
        while (samplePtr < audioData.length) {
            if (this.samplesToNextFrame <= 0) {
                if (this.frameCallback) {
                    let frameData = this.frameCallback(this.frameNumber);
                    if (this.onFrame) this.onFrame(frameData);
                    this.frameNumber++;
                    this.waveform = frameData.waveform;
                    this.volume = frameData.volume;
                    this.frequency = Math.floor(frameData.frequency);
                } else {
                    this.volume = 0;
                }
                this.samplesPerWaveformElement = this.sampleRate / this.frequency / 32;
                this.samplesToNextFrame += this.samplesPerFrame;
            }
            if (this.samplesToNextWaveformElement <= 0) {
                level = this.waveform[this.waveformPtr];
                this.waveformPtr = (this.waveformPtr + 1) % 32;
                this.samplesToNextWaveformElement += this.samplesPerWaveformElement;
            }
            let finalLevel = (level - 7.5) / 7.5 * this.volume / 15;
            audioData[samplePtr++] = finalLevel;
            this.samplesToNextWaveformElement--;
            this.samplesToNextFrame--;
        }
    }
}