// scripts/Track.js
// 2D lane-based track manager
// Handles road projection, lane positions, start/finish, and scaling for pseudo-3D effect

export default class Track {
    constructor(options = {}) {
        this.lanes = options.lanes || 3;        // number of lanes (-1,0,+1)
        this.length = options.length || 10000;  // total track length
        this.width = options.width || 600;      // road width in pixels
        this.segmentLength = options.segmentLength || 200; // distance between segments
        this.segments = [];                      // array of track segments

        this.startLine = options.startLine || 0;
        this.finishLine = options.finishLine || this.length;

        // generate flat segments (can add curves/elevation later)
        this.generateSegments();
    }

    generateSegments() {
        const count = Math.ceil(this.length / this.segmentLength);
        this.segments = [];

        for (let i = 0; i < count; i++) {
            const segment = {
                index: i,
                z: i * this.segmentLength,
                curve: 0,        // curve strength (for future use)
                y: 0             // elevation
            };
            this.segments.push(segment);
        }
    }

    // Project world position + lane into screen coordinates
    // Returns: { x, y, scale }
    // position: distance along track
    // lane: -1 left, 0 center, +1 right
    project(position, lane = 0, camera = { x: 0, y: 0, z: 0 }) {
        if (!this.segments.length) return null;

        // clamp position
        position = Math.max(0, Math.min(position, this.length));

        // find segment
        const index = Math.floor(position / this.segmentLength);
        const segment = this.segments[Math.min(index, this.segments.length - 1)];

        // basic perspective scaling (near/far)
        const cameraZ = camera.z || 0;
        const dz = segment.z - cameraZ;
        const scale = 1000 / (dz + 1);  // tweakable perspective

        // lane offset
        const laneWidth = this.width / this.lanes;
        const x = (lane * laneWidth) * scale + (camera.x || 0);
        const y = (segment.y - (camera.y || 0)) * scale + 300; // baseline screen y

        return { x, y, scale };
    }

    // helper: return lane x offset in pixels (screen space)
    getLaneOffset(lane = 0, scale = 1) {
        const laneWidth = this.width / this.lanes;
        return lane * laneWidth * scale;
    }

    // optional: get next segment for collision/AI
    getSegmentAt(position) {
        const index = Math.floor(position / this.segmentLength);
        return this.segments[Math.min(index, this.segments.length - 1)];
    }

    // optional: draw track (for debug or background)
    draw(ctx, camera = { x: 0, y: 0, z: 0 }) {
        if (!ctx) return;

        const horizon = 300;
        const roadWidth = this.width;

        for (let i = 0; i < this.segments.length; i++) {
            const seg = this.segments[i];
            const screen = this.project(seg.z, 0, camera);
            if (!screen) continue;

            const laneW = roadWidth / this.lanes * screen.scale;
            ctx.fillStyle = i % 2 === 0 ? "#555555" : "#666666"; // simple alternating road color
            ctx.fillRect(screen.x - laneW * 1.5, screen.y, laneW * 3, 4); // road segment

            // lane dividers
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            for (let l = 1; l < this.lanes; l++) {
                const lx = screen.x - laneW * 1.5 + l * laneW;
                ctx.beginPath();
                ctx.moveTo(lx, screen.y);
                ctx.lineTo(lx, screen.y + 4);
                ctx.stroke();
            }
        }
    }
}
