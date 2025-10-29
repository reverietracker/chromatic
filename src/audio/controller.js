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
        this.channelStates = [];
        for (let i = 0; i < 4; i++) {
            this.channelStates[i] = {
                instrumentNumber: 1,
                instrumentCallback: null,
                instrumentFrame: 0,
            };
        }
        this.lastInstrumentNumber = [1, 1, 1, 1];
    }
    play(frameCallback) {
        /* Start playback of TIC audio. The frameCallback function will
         * be called for each frame with the frame number as its argument,
         * and should return an array of 4 channel data objects. Each channel
         * data object should have 'waveform' (array of 32 volume values),
         * 'volume' (0-15), and 'frequency' (in Hz) properties. If a channel
         * data object is null, that channel will be silent.
         */
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
    clearChannelStates() {
        for (let i = 0; i < 4; i++) {
            this.channelStates[i].instrumentCallback = null;
            this.channelStates[i].instrumentFrame = 0;
        }
    }
    readRow(pattern, rowNumber) {
        if (!this.song) return;
        for (let chan = 0; chan < 4; chan++) {
            const row = pattern.channels[chan].rows[rowNumber];
            const note = row.note;
            if (note !== 0) {
                const frequency = NOTES_BY_NUM[note].frequency;
                if (row.instrument) {
                    this.channelStates[chan].instrumentNumber = row.instrument;
                }
                const instrument = this.song.instruments[this.channelStates[chan].instrumentNumber];
                this.channelStates[chan].instrumentCallback = instrument.getFrameCallback(frequency);
                this.channelStates[chan].instrumentFrame = 0;
            }
        }
    }
    playRow(pattern, rowNumber) {
        this.clearChannelStates();
        this.readRow(pattern, rowNumber);
        const frameCallback = () => {
            return this.channelStates.map((state) => (
                state.instrumentCallback ?
                state.instrumentCallback(state.instrumentFrame++) : null
            ));
        };
        this.play(frameCallback);
    }
    setVolume(vol) {
        this.volume = vol;
        if (this.gainNode) this.gainNode.gain.value = vol;
    }
}
