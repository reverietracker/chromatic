import { TICSynth } from './ticsynth';

export class AudioController {
    constructor() {
        this.audioStarted = false;
        this.ticSynth = null;
        this.gainNode = null;
        this.volume = 0.3;
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

        this.ticSynth.frameCallback = frameCallback;
    }
    stop() {
        this.ticSynth.frameCallback = null;
    }
    setVolume(vol) {
        this.volume = vol;
        if (this.gainNode) this.gainNode.gain.value = vol;
    }
}
