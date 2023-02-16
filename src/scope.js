export class Scope {
    constructor(canvas) {
        this.width = canvas.width;
        this.height = canvas.height;
        this.ctx = canvas.getContext('2d');
    }
    clear() {
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    drawFrame(frameData) {
        this.clear();
        this.ctx.fillStyle = "green";
        for (let i = 0; i < 32; i++) {
            const level = (frameData.waveform[i] - 7.5) / 7.5 * frameData.volume / 15;
            this.ctx.fillRect(i * this.width / 32, (-level + 1) / 2 * (this.height - 4), this.width / 32, 4);
        }
    }
}
