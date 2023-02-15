export class SquareWave {
    getFrameCallback(freq) {
        return () => {
            return {
                frequency: freq,
                volume: 15,
                waveform: [
                    15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                ],
            };
        }
    }
}
