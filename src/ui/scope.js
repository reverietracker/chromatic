import { Component } from 'catwalk-ui';

export class Scope extends Component {
    constructor() {
        super();
        this.width = 256;
        this.height = 128;
        this.waveformGenerator = null;
        this._scrubControlNode = null;
        this.changeHandler = () => {
            this.waveformGenerator = this.model.getFrameCallback(440);
            this.drawAtScrubPosition();
        }
    }

    set scrubControlNode(node) {
        this._scrubControlNode = node;
        this.drawAtScrubPosition();
    }

    trackModel(model) {
        if (this.model) {
            this.model.removeListener("change", this.changeHandler);
        }
        super.trackModel(model);
        this.model.addListener("change", this.changeHandler);
        this.changeHandler();
    }

    createNode() {
        const node = (
            <canvas className="scope" width={this.width} height={this.height}></canvas>
        );
        this.ctx = node.getContext('2d');
        this.drawAtScrubPosition();
        return node;
    }

    clear() {
        if (!this.ctx) return;
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    drawFrame(frameData) {
        if (!this.ctx) return;
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

    drawAtScrubPosition() {
        if (!this._scrubControlNode || !this.waveformGenerator) return;
        const frameData = this.waveformGenerator(this._scrubControlNode.value);
        this.drawFrame(frameData);
    }
}
