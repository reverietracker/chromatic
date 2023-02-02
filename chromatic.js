let masterVolumeControl;
let audioContext;
let samplesPerFrame;
const BUFFER_SIZE = 0x10000;

const playStart = (freq) => {
    if (audioContext) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext({latencyHint: 'interactive'});
    samplesPerFrame = audioContext.sampleRate / 60;
    const scriptNode = audioContext.createScriptProcessor(0, 0, 1);

    let samplesToNextFrame = 0;
    let samplesToNextWaveformElement = 0;
    let waveformPtr = 0;
    let samplesPerWaveformElement;
    let waveform;

    scriptNode.onaudioprocess = (audioProcessingEvent) => {
        const outputBuffer = audioProcessingEvent.outputBuffer;
        const audioData = outputBuffer.getChannelData(0);
        let samplePtr = 0;
        let level;
        while (samplePtr < audioData.length) {
            if (samplesToNextFrame <= 0) {
                // waveformPtr = 0;
                samplesPerWaveformElement = audioContext.sampleRate / freq / 32;
                //samplesToNextWaveformElement = 0;
                waveform = [
                    15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                ]
                samplesToNextFrame += samplesPerFrame;
            }
            if (samplesToNextWaveformElement <= 0) {
                level = waveform[waveformPtr];
                waveformPtr = (waveformPtr + 1) % 32;
                samplesToNextWaveformElement += samplesPerWaveformElement;
            }
            audioData[samplePtr++] = (level - 7.5) / 7.5;
            samplesToNextWaveformElement--;
            samplesToNextFrame--;
        }
    }
    const gainNode = audioContext.createGain();
    gainNode.gain.value = masterVolumeControl.value / 1000;

    scriptNode.connect(gainNode);
    gainNode.connect(audioContext.destination);

}
const playStop = () => {
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

document.addEventListener("DOMContentLoaded", () => {
    masterVolumeControl = document.getElementById("master-volume");
    const keyboard = document.getElementById("keyboard");
    function createKey(freq, noteName) {
        const key = document.createElement('button');
        key.innerText = noteName;
        keyboard.appendChild(key);
        key.addEventListener("mousedown", () => {
            playStart(freq);
        })
    }
    for (let oct=3; oct<6; oct++) {
        for (let n=0; n<12; n++) {
            const noteVal = (oct*12 + n) - 57;
            const noteName = NOTE_NAMES[n] + oct;
            createKey(440 * 2**(noteVal/12), noteName);
        }
    }
    const playButton = document.getElementById("play");
    window.addEventListener("mouseup", () => {
        playStop();
    })
})
