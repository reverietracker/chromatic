import { EventEmitter } from 'events';
import { TICSynth } from './ticsynth';
import { NOTES_BY_NUM } from '../defs';

export class AudioController extends EventEmitter {
    constructor() {
        super();
        this.audioStarted = false;
        this.ticSynth = null;
        this.gainNode = null;
        this.volume = 0.3;
        this.song = null;
        this.lastInstrumentNumber = [1, 1, 1, 1];
    }
    play(frameCallback) {
        if (!this.audioStarted) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContext({latencyHint: 'interactive'});
    
            this.ticSynth = new TICSynth(audioContext.sampleRate);
            const scriptNode = audioContext.createScriptProcessor(0, 0, 1);
            scriptNode.onaudioprocess = (audioProcessingEvent) => {
                const outputBuffer = audioProcessingEvent.outputBuffer;
                const audioData = outputBuffer.getChannelData(0);
                this.ticSynth.generate(audioData);
            }
            this.gainNode = audioContext.createGain();
            this.gainNode.gain.value = this.volume;
    
            scriptNode.connect(this.gainNode);
            this.gainNode.connect(audioContext.destination);
        }
        this.audioStarted = true;

        this.ticSynth.frameNumber = 0;
        this.ticSynth.frameCallback = frameCallback;
        this.ticSynth.onFrame = (frameData) => {
            this.emit('frame', frameData);
        }
    }
    stop() {
        this.ticSynth.frameCallback = null;
        this.emit('stop');
    }
    playInstrument(instrument, frequency) {
        const instrumentFrameCallback = instrument.getFrameCallback(frequency);
        const frameCallback = (frameNumber) => {
            return [instrumentFrameCallback(frameNumber)];
        }
        this.play(frameCallback);
    }
    playRow(patternNumber, rowNumber) {
        if (!this.song) return;
        const instrumentCallbacks = [];
        const pattern = this.song.patterns[patternNumber];
        for (let chan = 0; chan < 4; chan++) {
            const row = pattern.channels[chan].rows[rowNumber];
            const note = row.note;
            if (note === 0) {
                instrumentCallbacks[chan] = null;
            } else {
                const frequency = NOTES_BY_NUM[note].frequency;

                const instrumentNumber = row.instrument || this.lastInstrumentNumber[chan];
                this.lastInstrumentNumber[chan] = instrumentNumber;
                const instrument = this.song.instruments[instrumentNumber];

                instrumentCallbacks[chan] = instrument.getFrameCallback(frequency);
            }
        }
        const frameCallback = (frameNumber) => {
            return instrumentCallbacks.map((fn) => fn ? fn(frameNumber) : null);
        };
        this.play(frameCallback);
    }
    setVolume(vol) {
        this.volume = vol;
        if (this.gainNode) this.gainNode.gain.value = vol;
    }
}
