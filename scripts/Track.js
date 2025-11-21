// ===============================================
//                   TRACK SYSTEM
//  Converts lane + forward distance → screen XY
//  Generates simple infinite road segments
// ===============================================

export default class Track {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        // Road width (affects perspective)
        this.roadWidth = 2200;

        // Camera height for projection
        this.cameraHeight = 1000;

        // Horizon point
        this.horizon = canvas.height * 0.25;

        // List of segments
        this.segments = [];
        this.segmentLength = 300;

        this.generateInitialTrack();
    }

    // ----------------------------------------------------
    //         GENERATE SIMPLE STRAIGHT ROAD
    // ----------------------------------------------------
    generateInitialTrack() {
        let z = 0;

        for (let i = 0; i < 500; i++) {
            this.segments.push({
                index: i,
                p1: { z: z },
                p2: { z: z + this.segmentLength }
            });

            z += this.segmentLength;
        }
    }

    // ----------------------------------------------------
    //          PROJECT 3D TRACK → 2D SCREEN
    // ----------------------------------------------------
    project(position, laneOffset) {
        // Find the segment containing the player
        const index = Math.floor(position / this.segmentLength) % this.segments.length;
        const segment = this.segments[index];
        if (!segment) return null;

        const relativeZ = position - segment.p1.z;

        // Depth calculation
        const camZ = position + this.cameraHeight;

        const scale = this.cameraHeight / (camZ - position + 1);
        const centerX = this.canvas.width / 2;

        // Lane system
        const laneX = laneOffset * (this.roadWidth * 0.25);

        const x = centerX + laneX * scale;
        const y = this.horizon + (this.canvas.height - this.horizon) * scale;

        return { x, y, scale };
    }

    // ----------------------------------------------------
    //               DRAW ROAD STRIPS (OPTIONAL)
    // ----------------------------------------------------
    drawRoad() {
        const ctx = this.ctx;

        ctx.fillStyle = "#333";
        ctx.fillRect(0, this.horizon, this.canvas.width, this.canvas.height);

        ctx.fillStyle = "#555";

        // simple road rectangle (not projected)
        const roadWidthBottom = this.canvas.width * 0.7;
        const roadWidthTop = this.canvas.width * 0.2;

        ctx.beginPath();
        ctx.moveTo((this.canvas.width - roadWidthBottom) / 2, this.canvas.height);
        ctx.lineTo((this.canvas.width + roadWidthBottom) / 2, this.canvas.height);
        ctx.lineTo((this.canvas.width + roadWidthTop) / 2, this.horizon);
        ctx.lineTo((this.canvas.width - roadWidthTop) / 2, this.horizon);
        ctx.closePath();
        ctx.fill();
    }
}
