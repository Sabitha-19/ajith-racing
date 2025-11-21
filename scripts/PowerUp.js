// ================================
//            POWER UP
// ================================

export default class PowerUp {
    constructor(image, lane = 0, position = 0, type = "coin") {
        this.image = image;

        // Track-based 3D position
        this.lane = lane;       // -1 = left, 0 = center, 1 = right
        this.position = position;

        this.type = type;       // "coin" | "nitro" | "health"

        this.width = 80;
        this.height = 80;

        this.spin = 0;
        this.scale = 1;

        this.x = 0; // screen coords updated every frame
        this.y = 0;

        this.collected = false;

        // Glow effect for better visibility
        this.glowPulse = 0;
    }

    update(delta, track) {
        if (this.collected) return;

        // Rotate
        this.spin += delta * 4;

        // Glow animation
        this.glowPulse += delta * 3;

        // Convert track position → screen
        const screen = track.project(this.position, this.lane);

        if (!screen) return;

        this.x = screen.x;
        this.y = screen.y;
        this.scale = screen.scale;
    }

    checkCollision(player) {
        if (this.collected) return false;

        // 1. Check forward distance
        const dist = Math.abs(player.position - this.position);
        if (dist > 45) return false;

        // 2. Check lane alignment
        const laneDiff = Math.abs(player.lane - this.lane);
        if (laneDiff > 0.55) return false;

        // Collected!
        this.collected = true;
        return true;
    }

    draw(ctx) {
        if (this.collected) return;
        if (!this.scale) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        ctx.rotate(this.spin);

        // 🌟 Glow effect
        const glowSize = 10 + Math.sin(this.glowPulse) * 5;

        ctx.shadowBlur = glowSize;
        ctx.shadowColor =
            this.type === "coin" ? "yellow" :
            this.type === "nitro" ? "cyan" :
            this.type === "health" ? "red" : "white";

        if (this.image.complete) {
            ctx.drawImage(
                this.image,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
        } else {
            // Fallback shapes
            ctx.fillStyle =
                this.type === "coin" ? "gold" :
                this.type === "nitro" ? "cyan" :
                this.type === "health" ? "red" : "white";

            ctx.beginPath();
            ctx.arc(0, 0, this.width * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
