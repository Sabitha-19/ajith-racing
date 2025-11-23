// scripts/Enemy.js
// ---------------------------------------------
// Pure 2D Enemy Racer
// Works with Track.js + RacerGame.js
// ---------------------------------------------

export default class Enemy {
    constructor(options = {}) {
        this.track = options.track;
        this.sprite = options.sprite; // image object
        this.lane = options.lane ?? 0; // -1, 0, 1
        this.position = options.position ?? -1000; // starts behind player
        this.speed = options.speed ?? 250; // forward speed
        this.maxSpeed = options.maxSpeed ?? 360;
        this.aiChangeLaneTimer = 0;

        // render settings
        this.width = 130;
        this.height = 260;

        // collision
        this.hitRadius = 65;

        this.x = 0;
        this.y = 0;
        this.scale = 1;
    }

    update(delta, player) {
        // move forward
        this.position += this.speed * delta;

        // enemy tries to overtake the player
        if (player && this.position < player.position + 300) {
            this.speed += 120 * delta; // accelerate to catch up
        } else {
            this.speed -= 80 * delta; // slow if too far
        }

        // cap speed
        this.speed = Math.max(120, Math.min(this.speed, this.maxSpeed));

        // AI lane switching every few seconds
        this.aiChangeLaneTimer -= delta;
        if (this.aiChangeLaneTimer <= 0) {
            this.aiChangeLaneTimer = 2 + Math.random() * 2;
            const lanes = [-1, 0, 1];
            this.lane = lanes[Math.floor(Math.random() * lanes.length)];
        }

        // project on screen using Track.js
        const screen = this.track.project(this.position, this.lane);
        this.x = screen.x;
        this.y = screen.y;
        this.scale = screen.scale;
    }

    draw(ctx) {
        if (!this.scale) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);

        if (this.sprite && this.sprite.complete) {
            ctx.drawImage(
                this.sprite,
                -this.width / 2,
                -this.height,
                this.width,
                this.height
            );
        } else {
            // fallback red car
            ctx.fillStyle = "blue";
            ctx.fillRect(-40, -100, 80, 180);
        }

        ctx.restore();
    }

    // simple circle-based collision
    collidesWith(player) {
        if (!player) return false;
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < this.hitRadius + player.hitRadius;
    }
}
