import Spline from 'cubic-spline';

export class Frame {
    constructor(frequency, volume, waveform) {
        this.frequency = frequency;
        this.volume = volume;
        this.waveform = waveform;
    }

    repr() {
        return `<Frame: ${this.frequency}.000000 Hz, ampl ${this.volume}, (${this.waveform.join(", ")})>`;
    }
}

export const normalizeWave = (wav) => {
    // convert to an array of mono samples between -1 and 1
    let samples = [];
    if (wav.fmt.numChannels == 1) {
        // mono
        if (wav.fmt.bitsPerSample == 8) {
            // 8 bit unsigned
            for (let i = 0; i < wav.data.samples.length; i++) {
                const sample = wav.data.samples[i];
                samples.push((sample - 128) / 128);
            }
        } else if (wav.fmt.bitsPerSample == 16) {
            // 16 bit signed
            for (let i = 0; i < wav.data.samples.length; i++) {
                const sample = wav.data.samples[i];
                samples.push(sample / 32768);
            }
        } else {
            console.error("unsupported bit depth: " + wav.fmt.bitsPerSample);
        }
    } else if (wav.fmt.numChannels == 2) {
        // stereo - average the two channels
        if (wav.fmt.bitsPerSample == 8) {
            // 8 bit unsigned
            for (let i = 0; i < wav.data.samples.length; i += 2) {
                const sampleL = wav.data.samples[i];
                const sampleR = wav.data.samples[i + 1];
                samples.push(((sampleL - 128) / 128 + (sampleR - 128) / 128) / 2);
            }
        } else if (wav.fmt.bitsPerSample == 16) {
            // 16 bit signed
            for (let i = 0; i < wav.data.samples.length; i += 2) {
                const sampleL = wav.data.samples[i];
                const sampleR = wav.data.samples[i + 1];
                samples.push((sampleL / 32768 + sampleR / 32768) / 2);
            }
        } else {
            console.error("unsupported bit depth: " + wav.fmt.bitsPerSample);
        }
    } else {
        console.error("unsupported number of channels: " + wav.fmt.numChannels);
    }
    return samples;
}

export const getPeriod = (block, windowSize) => {
    const orig = block.slice(0, windowSize);
    const results = [];
    let bestDiff = 999999;
    let bestOffset = null;
    for (let offset = 10; offset < block.length - windowSize; offset++) {
        const shiftedWave = block.slice(offset, windowSize + offset);
        // find sum of absolute differences between orig and shiftedWave
        const diffs = orig.map((val, i) => Math.abs(val - shiftedWave[i]));
        const diff = diffs.reduce((a, b) => a + b, 0);
        results.push(diff);
        if (diff < bestDiff) {
            bestOffset = offset;
            bestDiff = diff;
        }
    }
    const avgDiff = results.reduce((a, b) => a + b, 0) / results.length;
    const confidence = avgDiff / bestDiff;
    // print("best %f, avg %f, confidence %f" % (bestDiff, avgDiff, confidence))
    return [bestOffset, confidence];
}

export const getSingleWave = (block, period) => {
    const slice = block.slice(0, period);
    // if all values in slice are positive or all negative, return slice as is
    if (slice.every(val => val < 0) || slice.every(val => val > 0)) {
        return slice;
    }
    let i = slice.indexOf(Math.max(...slice));
    while (slice[i] > 0) {
        i = (i - 1 + period) % period;
    }
    return slice.slice(i + 1).concat(slice.slice(0, i + 1));
}

export const makeFrame = (block, sampleRate) => {
    let [period, confidence] = getPeriod(block, Math.floor(block.length / 2));
    if (confidence < 1.3) {
        period = Math.floor(sampleRate / 220);
    }
    const freq = sampleRate / period;
    // get single waveform cycle as a list of samples
    const singleWave = getSingleWave(block, period);
    // find the largest absolute amplitude in singleWave
    const amplitude = Math.max(...singleWave.map(Math.abs));
    // normalize singleWave to -1 to 1
    const normSingleWave = singleWave.map(sample => sample / amplitude);

    // create a cubic spline interpolation of normSingleWave
    const spline = new Spline(
        Array.from({length: normSingleWave.length}, (_, i) => i / (normSingleWave.length - 1)),
        normSingleWave
    );

    let finalAmpl = Math.min(Math.floor(amplitude*16), 15);
    let finalWave;
    if (finalAmpl == 0) {
        finalWave = Array(32).fill(0);
    } else if (confidence < 1.3) {
        finalWave = Array(32).fill(0);
        finalAmpl = Math.floor(amplitude * 11);
    } else {
        finalWave = Array.from({length: 32}, (_, i) =>
            Math.round(Math.max(-0.999999, Math.min(0.999999, spline.at(i / 31))) * 7 + 8)
        );
    }

    return new Frame(Math.round(freq), finalAmpl, finalWave);
}
