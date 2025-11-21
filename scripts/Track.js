// Track.js
export default class Track {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        // Road properties
        this.roadWidth = this.width * 0.6;
        this.laneCount = 3;

        // Generate lane boundaries
        this.leftBorder = (this.width - this.roadWidth) / 2;
        this.rightBorder = this.leftBorder + this.roadWidth;

        // For scrolling effect
        this.offsetY = 0;
        this.speed = 5;
    }

    update(delta) {
        this.offsetY += this.speed * delta;
        if (this.offsetY > this.height) {
            this.offsetY = 0;
        }
    }

    draw(ctx) {
        ctx.fillStyle = "#222";
        ctx.fillRect(0, 0, this.width, this.height);

        // Road background
        ctx.fillStyle = "#333";
        ctx.fillRect(this.leftBorder, 0, this.roadWidth, this.height);

        // Lane lines
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 4;
        ctx.setLineDash([30, 30]);

        for (let i = 1; i < this.laneCount; i++) {
            const x = this.getLaneCenter(i) - this.roadWidth / this.laneCount / 2;
            ctx.beginPath();
            ctx.moveTo(x, -this.offsetY);
            ctx.lineTo(x, this.height - this.offsetY);
            ctx.stroke();
        }

        ctx.setLineDash([]);
    }

    getLaneCenter(laneIndex) {
        const laneWidth = this.roadWidth / this.laneCount;
        return this.leftBorder + laneWidth / 2 + laneIndex * laneWidth;
    }

    inRoad(x) {
        return x >= this.leftBorder && x <= this.rightBorder;
    }

    checkCollision(player) {
        if (!this.inRoad(player.x)) {
            player.crash = true;
        }
    }
}
