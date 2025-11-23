// scripts/Enemy.js
// Lane-based 2D enemy racer
// Works with Track.js and RacerGame.js

export default class Enemy {
    constructor(sprite = null, startLane = 0, startPos = 0) {
        this.sprite = sprite;

        // track-space
        this.position = startPos;  // forward distance
        this.lane = startLane;     // -1 left, 0 center, +1 right
        this.targetLane = startLane;

        // movement
        this.speed = 12 + Math.random() * 3;  // base speed
        this.maxSpeed = 16;
        this.accel = 3;

        // drift / lean
        this.lean = 0;

        // dimensions
        this.width = 110;
        this.height = 200;

        // health (optional)
        this.health = 100;

        // simple AI timers
        this.changeLaneTimer = Math.random() * 2 + 1; // seconds
    }

    // update each frame: delta in seconds
    update(delta = 1 / 60, track = null) {
        if (!track) return;

        // -------------------------
        // lane AI: randomly switch lanes
        // -------------------------
        this.changeLaneTimer -= delta;
        if (this.changeLaneTimer <= 0) {
            const dir = Math.floor(Math.random() * 3) - 1; // -1,0,1
            this.targetLane = Math.max(-1, Math.min(1, this.lane + dir));
            this.changeLaneTimer = Math.random() * 2 + 1;
        }

        // smooth lane movement
        const laneLerpSpeed = 2.5 * delta;
        this.lane += (this.targetLane - this.lane) * Math.min(1, laneLerpSpeed);

        // -------------------------
        // forward movement
        // -------------------------
        this.speed += this.accel * delta;
        if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
        this.position += this.speed * delta * 60; // match Racer scaling

        // simple lean based on lane change
        this.lean = (this.targetLane - this.lane) * 2;
    }

    // handle collision or crash
    crash() {
        this.speed *= 0.35;
    }

    // draw enemy on canvas
    draw(ctx, camera, track) {
        if (!track) return;
        const screen = track.project(this.position, this.lane);
        if (!screen) return;

        const { x, y, scale } = screen;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.rotate(this.lean * 0.05);

        const drawW = this.width;
        const drawH = this.height;

        if (this.sprite && this.sprite.complete) {
            ctx.drawImage(this.sprite, -drawW / 2, -drawH / 2, drawW, drawH);
        } else {
            ctx.fillStyle = "#ff0055";
            ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
        }

        // optional windshield
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(-drawW * 0.12, -drawH * 0.45, drawW * 0.24, drawH * 0.18);

        ctx.restore();
    }
}
