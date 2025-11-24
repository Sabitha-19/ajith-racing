// scripts/PowerUp.js
// Power-ups that appear on track: coin, nitro, health

export default class PowerUp {
    constructor(type = "coin", lane = 0, position = 0, sprite = null) {
        this.type = type;       // "coin" | "nitro" | "health"
        this.lane = lane;
        this.position = position;
        this.sprite = sprite;

        this.width = 60;
        this.height = 60;
        this.collected = false;
    }

    update(delta = 1 / 60, playerPosition = 0) {
        // Simple logic for removing power-ups player has passed
        if (playerPosition > this.position + 100) {
            this.collected = true;
        }
    }

    draw(ctx, camera, assets) {
        if (this.collected) return;
        
        const screen = camera.project(0, this.position);
        
        // Calculate X position based on lane in world coordinates
        const laneWidth = 80;
        const worldX = screen.x + this.lane * laneWidth;
        const screenY = screen.y;

        ctx.save();
        ctx.translate(worldX, screenY);

        const drawW = this.width;
        const drawH = this.height;
        
        const img = assets[this.type];

        if (img && img.complete) {
            ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        } else {
            // fallback visual
            ctx.fillStyle = this.type === "coin" ? "#ffcc00" :
                             this.type === "nitro" ? "#00FFFF" : // Cyan for nitro
                             "#33ff33"; // Green for health
            ctx.beginPath();
            ctx.arc(0, 0, drawW / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
