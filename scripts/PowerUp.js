// scripts/PowerUp.js
// Power-ups that appear on track: coin, nitro, health

export default class PowerUp {
    constructor(type = "coin", lane = 0, position = 0, sprite = null) {
        this.type = type;       // "coin" | "nitro" | "health"
        this.lane = lane;
        this.position = position;
        this.sprite = sprite;

        // size
        this.width = 60;
        this.height = 60;

        // collected flag
        this.collected = false;
    }

    update(delta = 1 / 60, playerPosition = 0) {
        // simple: if player passes power-up, can be considered for removal
        if (playerPosition > this.position + 200) {
            this.collected = true;
        }
    }

    checkCollision(player) {
        if (this.collected) return false;

        // simple lane + distance collision
        if (Math.abs(this.lane - player.lane) < 0.5) {
            if (Math.abs(this.position - player.position) < player.height / 2) {
                this.collected = true;
                player.applyPowerUp(this.type);
                return true;
            }
        }
        return false;
    }

    draw(ctx, track) {
        if (this.collected) return;
        const screen = track.project(this.position, this.lane);
        if (!screen) return;
        const { x, y, scale } = screen;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        const drawW = this.width;
        const drawH = this.height;

        if (this.sprite && this.sprite.complete) {
            ctx.drawImage(this.sprite, -drawW / 2, -drawH / 2, drawW, drawH);
        } else {
            // fallback visual
            ctx.fillStyle = this.type === "coin" ? "#ffcc00" :
                            this.type === "nitro" ? "#ff5500" :
                            "#33ff33";
            ctx.beginPath();
            ctx.arc(0, 0, drawW / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

