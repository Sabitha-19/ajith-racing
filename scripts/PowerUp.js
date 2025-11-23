// scripts/PowerUp.js
// Lane-based 2D power-up / collectible
// Works with Track.js and RacerGame.js

export default class PowerUp {
    constructor(type = "coin", lane = 0, position = 0, sprite = null) {
        this.type = type;           // "coin", "nitro", "health"
        this.lane = lane;           // -1, 0, +1
        this.position = position;   // forward distance along track
        this.sprite = sprite;

        this.width = 60;
        this.height = 60;

        this.collected = false;     // true if picked up by player
    }

    // check collision with player
    checkCollision(player) {
        if (this.collected) return false;
        const laneDiff = Math.abs(this.lane - player.lane);
        const posDiff = Math.abs(this.position - player.position);
        const laneThreshold = 0.5; // adjust as needed
        const posThreshold = 80;   // adjust based on track units

        if (laneDiff <= laneThreshold && posDiff <= posThreshold) {
            this.collected = true;
            player.applyPowerUp(this.type);
            return true;
        }
        return false;
    }

    // update (optional for animation)
    update(delta = 1 / 60) {
        // could add rotation, bounce, or sparkle
    }

    // draw on canvas
    draw(ctx, camera, track) {
        if (this.collected) return;
        if (!track) return;

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
            // fallback shapes
            switch (this.type) {
                case "coin":
                    ctx.fillStyle = "gold";
                    ctx.beginPath();
                    ctx.arc(0, 0, drawW / 2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case "nitro":
                    ctx.fillStyle = "orange";
                    ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
                    break;
                case "health":
                    ctx.fillStyle = "lime";
                    ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
                    ctx.strokeStyle = "#fff";
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(-drawW / 4, 0);
                    ctx.lineTo(drawW / 4, 0);
                    ctx.moveTo(0, -drawH / 4);
                    ctx.lineTo(0, drawH / 4);
                    ctx.stroke();
                    break;
            }
        }

        ctx.restore();
    }
}
