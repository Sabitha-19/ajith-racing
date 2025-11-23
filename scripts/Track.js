// scripts/Track.js
export default class Track {
    constructor(options = {}) {
        this.lanes = options.lanes || 3; // number of lanes
        this.laneWidth = options.laneWidth || 80; // width of each lane
        this.length = options.length || 5000; // total track length
        this.startY = options.startY || 0;
        this.finishY = options.finishY || -this.length;
        this.color = options.color || "#444"; // road color
        this.lineColor = options.lineColor || "#fff"; // lane lines
        this.lineWidth = options.lineWidth || 4;
    }

    // Convert lane index (-1,0,1) to X coordinate
    laneToX(laneIndex, canvasWidth) {
        const center = canvasWidth / 2;
        const offset = laneIndex * this.laneWidth;
        return center + offset;
    }

    // Project track position to screen coordinates
    project(position, laneIndex, canvas) {
        const y = canvas.height - (position - this.startY);
        const x = this.laneToX(laneIndex, canvas.width);
        const scale = 1; // optional: can scale for perspective effect
        return { x, y, scale };
    }

    draw(ctx, canvas) {
        // draw track background
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // draw lane lines
        ctx.strokeStyle = this.lineColor;
        ctx.lineWidth = this.lineWidth;
        for (let i = 1; i < this.lanes; i++) {
            const x = canvas.width / 2 - (this.lanes / 2 - i) * this.laneWidth;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
    }

    // Optional: check if a racer reached the finish
    isFinished(racerPosition) {
        return racerPosition >= this.length;
    }
}

