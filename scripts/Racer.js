// scripts/Racer.js
// ---------------------------------------------
// Main Player Racer (2D Engine)
// ---------------------------------------------

export default class Racer {
    constructor(options = {}) {

        this.track = options.track;
        this.sprite = options.sprite;

        // world coordinates
        this.lane = 0;              // -1 = left, 0 = center, +1 = right
        this.position = 0;          // forward distance on track

        // movement
        this.speed = 0;
        this.accel = 480;
        this.maxSpeed = 650;
        this.turnSpeed = 3.2;
        this.nitroBoost = 0;

        // render
        this.width = 150;
        this.height = 300;
        this.x = 0;
        this.y = 0;
        this.scale = 1;

        // collisions
        this.hitRadius = 65;

        // nitro system
        this.nitro = 0;        // nitro meter (0–100)
        this.nitroActive = false;

        // drifting effect
        this.drift = 0;
    }

    addNitro(amount) {
        this.nitro = Math.min(100, this.nitro + amount);
    }

    heal(amount) {
        // if you later add HP system, apply here
    }

    update(input, delta) {
        // ---------------------------------------------------
        // Forward movement
        // ---------------------------------------------------
        if (input.forward) {
            this.speed += this.accel * delta;
        } else {
            this.speed -= this.accel * 0.8 * delta;
        }

        this.speed = Math.max(0, Math.min(this.speed, this.maxSpeed + this.nitroBoost));

        this.position += this.speed * delta;

        // ---------------------------------------------------
        // Nitro boost
        // ---------------------------------------------------
        if (input.nitro && this.nitro > 0) {
            this.nitroActive = true;
            this.nitroBoost = 350;
            this.nitro -= 35 * delta; // fuel burns
        } else {
            this.nitroActive = false;
            this.nitroBoost = 0;
        }

        if (this.nitro <= 0) {
            this.nitroActive = false;
            this.nitroBoost = 0;
        }

        // ---------------------------------------------------
        // Lane changing (smooth)
        // ---------------------------------------------------
        let targetLane = this.lane;

        if (input.left) targetLane = -1;
        if (input.right) targetLane = 1;
        if (!input.left && !input.right) targetLane = 0;

        // Smooth slide
        this.lane += (targetLane - this.lane) * delta * this.turnSpeed;

        // drifting visual
        this.drift = (targetLane !== 0) ? (targetLane * 0.5) : 0;

        // ---------------------------------------------------
        // Project to screen
        // ---------------------------------------------------
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

        // tilt during drifting
        ctx.rotate(this.drift * 0.2);

        if (this.sprite && this.sprite.complete) {
            ctx.drawImage(
                this.sprite,
                -this.width / 2,
                -this.height,
                this.width,
                this.height
            );
        } else {
            // fallback draw
            ctx.fillStyle = "red";
            ctx.fillRect(-40, -100, 80, 180);
        }

        ctx.restore();

        // optional: nitro flame behind car
        if (this.nitroActive) this.drawNitro(ctx);
    }

    drawNitro(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y + 40);
        ctx.scale(this.scale, this.scale);

        ctx.fillStyle = "rgba(0,150,255,0.6)";
        ctx.beginPath();
        ctx.ellipse(0, 60, 20, 60, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
