// scripts/Enemy.js
// Simple AI-controlled enemy racer

export default class Enemy {
    constructor(sprite = null, lane = 0, startPosition = 0) {
        this.sprite = sprite;

        // track position
        this.position = startPosition; // forward distance
        this.lane = lane;               // current lane
        this.targetLane = lane;         // for smooth lane changes

        // movement
        this.speed = 10;                // base forward speed
        this.accel = 0.2;               // small acceleration
        this.friction = 0.98;

        // lane switching
        this.laneChangeInterval = 2.0;  // seconds between lane change decisions
        this._laneTimer = 0;

        // dimensions
        this.width = 110;
        this.height = 200;

        // crash handling
        this.crashed = false;
    }

    update(delta = 1 / 60) {
        if (this.crashed) {
            this.speed *= 0.95;
            return;
        }

        // AI lane switching logic
        this._laneTimer -= delta;
        if (this._laneTimer <= 0) {
            this._laneTimer = this.laneChangeInterval;
            // randomly pick a lane different from current
            const lanes = [-1, 0, 1].filter(l => l !== this.lane);
            this.targetLane = lanes[Math.floor(Math.random() * lanes.length)];
        }

        // smooth lane transition
        const laneLerpSpeed = 2.5 * delta;
        this.lane += (this.targetLane - this.lane) * Math.min(1, laneLerpSpeed);

        // forward movement
        this.position += this.speed * delta * 60;

        // optional friction
        this.speed *= Math.pow(this.friction, delta * 60);
    }

    crash() {
        this.crashed = true;
        this.speed = Math.max(0, this.speed * 0.3);
    }

    draw(ctx, track, canvas) {
        const screen = track.project(this.position, this.lane, canvas);
        if (!screen) return;
        const { x, y, scale } = screen;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        if (this.sprite && this.sprite.complete) {
            ctx.drawImage(this.sprite, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            ctx.fillStyle = "#ff3333";
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }

        ctx.restore();
    }
}
