import { EventEmitter } from 'events';
import { TICSynth } from './ticsynth';
import { MAX_NOTE_NUM, NOTES_BY_NUM, ORNAMENT_COUNT } from '../engines/chromatic/defs';

export class AudioController extends EventEmitter {
    constructor() {
        super();
        this.audioStarted = false;
        this.ticSynth = null;
        this.gainNode = null;
        this.volume = 0.3;
        this.song = null;
        this.channelStates = [];

        // true if we are currently playing a pattern or whole song
        // (not just a single row or instrument)
        this.isPlaying = false;

        for (let i = 0; i < 4; i++) {
            this.channelStates[i] = {
                instrument: null,
                instrumentFrame: 0,
                note: null,
                ornament: null,
            };
        }
    }
    setSong(song) {
        this.song = song;
        for (let i = 0; i < 4; i++) {
            this.channelStates[i].instrument = this.song.instruments[1];
        }
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
        this.isPlaying = false;
        this.emit('stop');
    }
    playInstrument(instrument, frequency) {
        const frameCallback = (frameNumber) => {
            return [instrument.getFrame(frequency, frameNumber)];
        }
        this.play(frameCallback);
    }
    clearChannelStates() {
        for (let i = 0; i < 4; i++) {
            this.channelStates[i].instrumentFrame = 0;
            this.channelStates[i].note = null;
        }
    }
    readRow(pattern, rowNumber) {
        if (!this.song) return;
        for (let chan = 0; chan < 4; chan++) {
            const row = pattern.channels[chan].rows[rowNumber];
            if (row.note !== 0) {
                this.channelStates[chan].note = row.note;
                if (row.instrument) {
                    this.channelStates[chan].instrument = this.song.instruments[row.instrument];
                }
                this.channelStates[chan].instrumentFrame = 0;
                if (row.effect == 0x0a && row.parameter <= ORNAMENT_COUNT) {
                    this.channelStates[chan].ornament = this.song.ornaments[row.parameter];
                } else {
                    this.channelStates[chan].ornament = null;
                }
            }
        }
    }
    getFrameFromState() {
        return this.channelStates.map((state) => {
            if (!state.instrument || !state.note) return null;
            let note = state.note;
            if (state.ornament) {
                const ornamentFrame = state.instrumentFrame % state.ornament.length;
                note += state.ornament.pitches[ornamentFrame];
                if (note < 1) {
                    note = 1;
                } else if (note > MAX_NOTE_NUM) {
                    note = MAX_NOTE_NUM;
                }
            }
            const frequency = NOTES_BY_NUM[note].frequency;
            return state.instrument.getFrame(frequency, state.instrumentFrame++);
        });
    }
    playRow(pattern, rowNumber) {
        this.clearChannelStates();
        this.readRow(pattern, rowNumber);
        const frameCallback = () => {
            return this.getFrameFromState();
        };
        this.play(frameCallback);
    }
    playPattern(pattern) {
        let rowNumber = 0;
        let rowFrameNumber = 0;
        this.clearChannelStates();
        const frameCallback = () => {
            if (rowFrameNumber === 0) {
                this.readRow(pattern, rowNumber);
                this.emit('row', rowNumber, pattern);
            }
            rowFrameNumber++;
            if (rowFrameNumber >= this.song.speed) {
                rowFrameNumber = 0;
                rowNumber++;
                if (rowNumber >= pattern.length) {
                    rowNumber = 0;
                }
            }
            return this.getFrameFromState();
        };
        this.isPlaying = true;
        this.play(frameCallback);
    }
    playSong(startPosition) {
        if (!this.song) return;
        let positionNumber = startPosition;
        let rowNumber = 0;
        let rowFrameNumber = 0;
        let pattern = null;
        this.clearChannelStates();
        this.emit('position', positionNumber);
        const frameCallback = () => {
            if (rowFrameNumber === 0) {
                const patternNumber = this.song.positions[positionNumber];
                pattern = this.song.patterns[patternNumber];
                this.readRow(pattern, rowNumber);
                this.emit('row', rowNumber, pattern);
            }
            rowFrameNumber++;
            if (rowFrameNumber >= this.song.speed) {
                rowFrameNumber = 0;
                rowNumber++;
                if (rowNumber >= pattern.length) {
                    rowNumber = 0;
                    positionNumber = (positionNumber + 1) % this.song.length;
                    this.emit('position', positionNumber);
                }
            }
            return this.getFrameFromState();
        };
        this.isPlaying = true;
        this.play(frameCallback);
    }
    setVolume(vol) {
        this.volume = vol;
        if (this.gainNode) this.gainNode.gain.value = vol;
    }
}
