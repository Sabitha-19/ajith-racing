export default class Racer {
    constructor(carSprite) {
        this.x = 0;
        this.y = 0;
        this.angle = 0;

        this.speed = 0;
        this.acc = 0.25;        // acceleration force
        this.maxSpeed = 8;      // normal max speed
        this.nitroSpeed = 15;   // boosted speed

        this.turnSpeed = 0.045; // steering
        this.friction = 0.94;

        this.sprite = carSprite;   // image loaded from main.js
        this.width = 70;
        this.height = 130;
    }

    update(input) {
        // ---- Steering ----
        if (input.steer !== 0) {
            this.angle += input.steer * this.turnSpeed;
        }

        // ---- Forward movement ----
        if (input.throttle > 0) {
            this.speed += this.acc;
        } else {
            this.speed *= this.friction;
        }

        // ---- Nitro ----
        if (input.nitro) {
            this.speed = this.nitroSpeed;
        } else {
            this.speed = Math.min(this.speed, this.maxSpeed);
        }

        // ---- Update position (Car direction) ----
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }

    draw(ctx, camera) {
        ctx.save();

        // Move car relative to camera
        ctx.translate(
            this.x - camera.x + window.innerWidth / 2,
            this.y - camera.y + window.innerHeight / 2
        );

        ctx.rotate(this.angle);

        if (this.sprite.complete) {
            ctx.drawImage(
                this.sprite,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
        } else {
            // fallback simple rectangle
            ctx.fillStyle = "cyan";
            ctx.fillRect(-25, -50, 50, 100);
        }

        ctx.restore();
    }
}
