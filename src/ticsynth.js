export class TICSynth {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;

        this.frameCallback = null;
        this.onFrame = null;
        this.frameNumber = 0;

        this.samplesPerFrame = sampleRate / 60;
        this.samplesToNextFrame = 0;

        this.channels = [];
        for (let i = 0; i < 4; i++) {
            this.channels[i] = {
                volume: 0,
                waveform: [
                    15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                ],
                waveformIsNoise: false,
                samplesToNextWaveformElement: 0,
                samplesPerWaveformElement: 0,
                waveformPtr: 0,
                level: 0,
            };
        }
    }
    generate(audioData) {
        let samplePtr = 0;
        while (samplePtr < audioData.length) {
            if (this.samplesToNextFrame <= 0) {
                if (this.frameCallback) {
                    let frameData = this.frameCallback(this.frameNumber);
                    if (this.onFrame) this.onFrame(frameData);
                    this.frameNumber++;
                    for (let chan = 0; chan < 4; chan++) {
                        const chanFrameData = frameData[chan];
                        const channel = this.channels[chan];
                        if (chanFrameData) {
                            channel.waveform = chanFrameData.waveform;
                            let waveformIsNoise = true;
                            for (let i = 0; i < 32; i++) {
                                if (channel.waveform[i] != 0) {
                                    waveformIsNoise = false;
                                    break;
                                }
                            }
                            channel.waveformIsNoise = waveformIsNoise;
                            channel.volume = chanFrameData.volume;
                            const frequency = Math.floor(chanFrameData.frequency);
                            channel.samplesPerWaveformElement = this.sampleRate / frequency / 32;
                            if (channel.waveformIsNoise) {
                                // fudge factor to match observed behaviour of TIC-80 -
                                // apparently noise values are only picked half as often
                                channel.samplesPerWaveformElement *= 2;
                            }
                        } else {
                            channel.volume = 0;
                        }
                    }
                } else {
                    for (let chan = 0; chan < 4; chan++) {
                        this.channels[chan].volume = 0;
                    }
                }

                this.samplesToNextFrame += this.samplesPerFrame;
            }

            let combinedLevel = 0;

            for (let chan = 0; chan < 4; chan++) {
                const channel = this.channels[chan];
                if (channel.samplesToNextWaveformElement <= 0) {
                    if (channel.waveformIsNoise) {
                        channel.level = Math.random() >= 0.5 ? 15 : 0;
                    } else {
                        channel.level = channel.waveform[channel.waveformPtr];
                    }
                    channel.waveformPtr = (channel.waveformPtr + 1) % 32;
                    channel.samplesToNextWaveformElement += channel.samplesPerWaveformElement;
                }
                channel.samplesToNextWaveformElement--;
                combinedLevel += (channel.level - 7.5) / 7.5 * channel.volume / 15;
            }
            audioData[samplePtr++] = combinedLevel;
            this.samplesToNextFrame--;
        }
    }
}