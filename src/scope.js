import { Component } from 'catwalk-ui';

export class Scope extends Component {
    constructor() {
        super();
        this.width = 256;
        this.height = 128;
    }

    createNode() {
        const node = (
            <canvas className="scope" width={this.width} height={this.height}></canvas>
        );
        this.ctx = node.getContext('2d');
        return node;
    }

    clear() {
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    drawFrame(frameData) {
        this.clear();
        this.ctx.fillStyle = "green";

        let waveformIsNoise = true;
        for (let i = 0; i < 32; i++) {
            if (frameData.waveform[i] != 0) {
                waveformIsNoise = false;
                break;
            }
        }

        for (let i = 0; i < 32; i++) {
            let waveLevel;
            if (waveformIsNoise) {
                waveLevel = Math.random() >= 0.5 ? 15 : 0;
            } else {
                waveLevel = frameData.waveform[i];
            }
            const level = (waveLevel - 7.5) / 7.5 * frameData.volume / 15;
            this.ctx.fillRect(i * this.width / 32, (-level + 1) / 2 * (this.height - 4), this.width / 32, 4);
        }
    }
}
