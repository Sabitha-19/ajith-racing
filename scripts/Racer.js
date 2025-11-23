// scripts/Racer.js
export default class Racer {
    constructor(options = {}) {
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.width = options.width || 40;
        this.height = options.height || 60;
        this.speed = options.speed || 0;
        this.maxSpeed = options.maxSpeed || 6;
        this.acceleration = options.acceleration || 0.2;
        this.friction = options.friction || 0.05;
        this.angle = 0; // rotation in radians
        this.color = options.color || "red";
        this.isPlayer = options.isPlayer ?? true;
        this.boost = 0; // for power-ups
    }

    update(input, dt) {
        // Handle acceleration
        if (input.up) {
            this.speed += this.acceleration;
        } else if (input.down) {
            this.speed -= this.acceleration;
        } else {
            // friction
            if (this.speed > 0) this.speed -= this.friction;
            else if (this.speed < 0) this.speed += this.friction;
        }

        // Clamp speed
        this.speed = Math.max(-this.maxSpeed, Math.min(this.speed, this.maxSpeed + this.boost));

        // Handle turning
        if (input.left) {
            this.angle -= 0.04 * (this.speed / this.maxSpeed);
        }
        if (input.right) {
            this.angle += 0.04 * (this.speed / this.maxSpeed);
        }

        // Update position
        this.x += Math.sin(this.angle) * this.speed * dt * 60;
        this.y -= Math.cos(this.angle) * this.speed * dt * 60;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Racer body
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Optional player indicator
        if (this.isPlayer) {
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 2;
            ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }

        ctx.restore();
    }

    // Apply a temporary speed boost (for power-ups)
    applyBoost(amount, duration) {
        this.boost += amount;
        setTimeout(() => {
            this.boost -= amount;
        }, duration);
    }
}
