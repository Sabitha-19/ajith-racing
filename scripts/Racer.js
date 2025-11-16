export default class Racer {
    constructor() {
        this.x = window.innerWidth / 2;
        this.y = window.innerHeight / 2;

        this.speed = 0;
        this.angle = 0;

        this.maxSpeed = 6;
        this.nitroBoost = 12;
    }

    update(input) {
        // Steering left-right
        this.angle += input.steer * 0.08;

        // Throttle / forward
        if (input.throttle > 0) {
            this.speed += 0.3;
        } else {
            this.speed *= 0.95; // slowdown when not accelerating
        }

        // Nitro boost
        if (input.nitro) {
            this.speed = this.nitroBoost;
        } else {
            this.speed = Math.min(this.speed, this.maxSpeed);
        }

        // Move car based on angle + speed
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Screen wrap (so car never disappears)
        if (this.x < 0) this.x = window.innerWidth;
        if (this.x > window.innerWidth) this.x = 0;
        if (this.y < 0) this.y = window.innerHeight;
        if (this.y > window.innerHeight) this.y = 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Simple car shape
        ctx.fillStyle = "cyan";
        ctx.fillRect(-25, -12, 50, 24);

        ctx.restore();
    }
}
