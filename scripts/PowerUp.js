// scripts/PowerUp.js
// ---------------------------------------------
// Pure 2D Power-Up Object
// Works with Track.js projection
// ---------------------------------------------

export default class PowerUp {
    constructor(options = {}) {

        this.track = options.track;
        this.sprite = options.sprite;

        // lane-based world position
        this.lane = options.lane ?? 0;           // -1, 0, +1
        this.position = options.position ?? 500;  // forward position on road

        // type = "coin" | "nitro" | "health"
        this.type = options.type ?? "coin";

        // render properties
        this.width = 90;
        this.height = 90;

        this.x = 0;
        this.y = 0;
        this.scale = 1;

        this.spin = 0;
        this.collected = false;

        // collision
        this.hitRadius = 55;
    }

    update(delta) {
        if (this.collected) return;

        // animate
        this.spin += delta * 3;

        // project world → screen
        const screen = this.track.project(this.position, this.lane);
        this.x = screen.x;
        this.y = screen.y;
        this.scale = screen.scale;

        // not visible behind camera
        if (this.scale <= 0) return;
    }

    draw(ctx) {
        if (this.collected || !this.scale) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        ctx.rotate(this.spin);

        if (this.sprite && this.sprite.complete) {
            ctx.drawImage(
                this.sprite,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
        } else {
            // fallback circle icon
            ctx.fillStyle = "gold";
            ctx.beginPath();
            ctx.arc(0, 0, 35, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    checkCollision(player) {
        if (this.collected) return false;

        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.hitRadius + player.hitRadius) {
            this.collected = true;  // remove from game
            return true;
        }

        return false;
    }
}
