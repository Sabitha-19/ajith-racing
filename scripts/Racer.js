// scripts/Racer.js

export default class Racer {
    constructor(options = {}) {
        // Player's visual position on canvas (fixed)
        this.x = options.x || 480;
        this.y = options.y || 600; 

        // Player's world position on the track
        this.position = options.position || 0; // Distance travelled down the track
        this.lane = options.lane || 0;       // -1 (Left), 0 (Center), 1 (Right)
        this.targetLane = this.lane;

        this.width = options.width || 40;
        this.height = options.height || 60;
        
        // Movement Physics
        this.speed = options.speed || 0;
        this.maxSpeed = options.maxSpeed || 8;
        this.acceleration = options.acceleration || 0.25;
        this.friction = options.friction || 0.05;
        
        // Game Stats
        this.health = options.health || 100;
        this.coins = options.coins || 0;
        this.nitro = false;
        this.nitroTime = 0; // seconds
        this.laneChangeSpeed = 5; // how fast the car moves between lanes
        this.isPlayer = options.isPlayer ?? true;
    }

    update(dt, controls) {
        // --- 1. Lane Movement (Side to Side) ---
        if (controls.left && this.targetLane > -1) {
            this.targetLane = -1;
        } else if (controls.right && this.targetLane < 1) {
            this.targetLane = 1;
        } else if (!controls.left && !controls.right) {
            this.targetLane = 0;
        }
        
        // Smoothly move towards the target lane (using X coordinate is simpler for non-perspective)
        // Since we are using lane index for CollisionManager, we smooth the index:
        this.lane += (this.targetLane - this.lane) * this.laneChangeSpeed * dt;

        // --- 2. Forward/Backward Movement (Speed) ---
        if (controls.up || (controls.left || controls.right)) { // Assume 'up' (ArrowUp/W) is accelerating, or any movement
            this.speed += this.acceleration * dt * 60;
        } else if (controls.down) { // Brakes/Reverse
            this.speed -= this.acceleration * 1.5 * dt * 60;
        } else {
            // Apply friction
            if (this.speed > 0) this.speed -= this.friction * dt * 60;
            else if (this.speed < 0) this.speed += this.friction * dt * 60;
        }
        
        // Nitro Boost
        let currentMaxSpeed = this.maxSpeed;
        if (this.nitro && this.nitroTime > 0) {
            currentMaxSpeed *= 1.8;
            this.nitroTime -= dt;
        } else {
            this.nitro = false;
            this.nitroTime = 0;
        }

        // Clamp speed
        this.speed = Math.max(-this.maxSpeed * 0.5, Math.min(this.speed, currentMaxSpeed));
        
        // Apply position change based on speed
        this.position += this.speed;
        
        // Ensure position doesn't go below 0 (start line)
        this.position = Math.max(0, this.position);
    }
    
    draw(ctx, assets) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const img = assets.car;
        const w = this.width * 2;
        const h = this.height * 2;

        if (img && img.complete) {
            ctx.drawImage(img, -w / 2, -h / 2, w, h);
        } else {
            ctx.fillStyle = "red";
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }

        ctx.restore();
    }
    
    applyPowerUp(type) {
        switch(type) {
            case "coin":
                this.coins += 1;
                break;
            case "health":
                this.health = Math.min(this.health + 20, 100);
                break;
            case "nitro":
                this.nitro = true;
                this.nitroTime = 4; // 4 seconds of boost
                break;
        }
    }
}
