// ================================
//            POWER UP
// ================================

export default class PowerUp {
    constructor(image, lane = 0, position = 0, type = "coin") {
        this.image = image;

        // Track-based position
        this.lane = lane;       // -1 = left, 0 = center, 1 = right
        this.position = position;

        this.type = type;       // "coin", "nitro", "health"

        this.width = 80;
        this.height = 80;

        this.spin = 0;
        this.scale = 1;

        // Screen position updated each frame
        this.x = 0;
        this.y = 0;

        this.collected = false;
    }

    update(delta, track) {
        if (this.collected) return;

        // Spin animation
        this.spin += delta * 3;

        // Project onto screen
        const screen = track.project(this.position, this.lane);

        this.x = screen.x;
        this.y = screen.y;
        this.scale = screen.scale;
    }

    checkCollision(player) {
        if (this.collected) return false;

        const dist = Math.abs(player.position - this.position);

        // Must be near in forward axis
        if (dist < 40) {
            // Must be in same lane
            if (Math.abs(player.lane - this.lane) < 0.6) {
                this.collected = true;
                return true;
            }
        }
        return false;
    }

    draw(ctx) {
        if (this.collected) return;
        if (!this.scale) return; // not visible yet

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        ctx.rotate(this.spin);

        if (this.image.complete) {
            ctx.drawImage(
                this.image,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
        } else {
            // Fallback shape
            ctx.fillStyle = "gold";
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
