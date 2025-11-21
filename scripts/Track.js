export default class Track {
    constructor() {
        this.segments = [];

        for (let i = 0; i < 200; i++) {
            this.segments.push({
                x: Math.sin(i * 0.1) * 10,
                y: -(i * 5),
                width: 15
            });
        }
    }

    draw(ctx, camera) {
        ctx.fillStyle = "#222";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.fillStyle = "#555";

        for (let seg of this.segments) {
            let sx = seg.x - camera.x + ctx.canvas.width / 2;
            let sy = seg.y - camera.y + ctx.canvas.height;

            ctx.fillRect(sx - seg.width, sy, seg.width * 2, 10);
        }
    }
}
