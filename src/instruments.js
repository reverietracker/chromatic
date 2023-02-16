export class SquareWave {
    getFrameCallback(freq) {
        return (frame) => {
            return {
                frequency: freq,
                volume: Math.max(0, 15 - frame),
                waveform: [
                    15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                ],
            };
        }
    }
}
