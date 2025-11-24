// scripts/Enemy.js
// Simple AI-controlled enemy racer

export default class Enemy {
    constructor(lane = 0, startPosition = 0, sprite = null) {
        this.sprite = sprite;
        this.position = startPosition; 
        this.lane = lane;           
        this.targetLane = lane;     

        this.speed = 4 + Math.random() * 2; // base forward speed (slower than player max)
        this.accel = 0.2;            
        this.friction = 0.98;

        this.laneChangeInterval = 2.0 + Math.random() * 3; // seconds between lane change decisions
        this._laneTimer = 0;
        this.laneChangeSpeed = 3;

        this.width = 110;
        this.height = 200;
        this.crashed = false;
    }

    update(delta = 1 / 60, playerPosition = 0) {
        if (this.crashed) {
            this.speed *= 0.95;
            return;
        }

        // --- AI lane switching logic ---
        this._laneTimer -= delta;
        if (this._laneTimer <= 0) {
            this._laneTimer = this.laneChangeInterval;
            // Target a lane (between -1 and 1)
            this.targetLane = Math.floor(Math.random() * 3) - 1; 
        }

        // smooth lane transition
        const laneLerpSpeed = this.laneChangeSpeed * delta;
        this.lane += (this.targetLane - this.lane) * Math.min(1, laneLerpSpeed);

        // forward movement
        this.position += this.speed * delta * 60;
        
        // Simple respawn (push enemy forward if too far behind player)
        if (this.position < playerPosition - 600) {
            this.position = playerPosition + 1000 + Math.random() * 500;
            this.lane = Math.floor(Math.random() * 3) - 1;
            this.targetLane = this.lane;
            this.crashed = false;
            this.speed = 4 + Math.random() * 2;
        }
    }

    crash() {
        this.crashed = true;
        this.speed = Math.max(0, this.speed * 0.3);
    }

    draw(ctx, camera, assets) {
        const screen = camera.project(0, this.position);
        
        // Calculate X position based on lane in world coordinates
        const laneWidth = 80;
        const worldX = screen.x + this.lane * laneWidth;
        const screenY = screen.y;

        ctx.save();
        ctx.translate(worldX, screenY);

        const img = assets.enemy;
        if (img && img.complete) {
            ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            ctx.fillStyle = "#ff3333";
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }

        ctx.restore();
    }
}
