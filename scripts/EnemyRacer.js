export default class EnemyRacer {
    constructor(sprite, startX, startY) {
        this.x = startX;
        this.y = startY;

        this.angle = Math.random() * Math.PI * 2;

        this.speed = 4 + Math.random() * 2;   // normal speed
        this.maxSpeed = 6 + Math.random() * 2;

        this.turnSpeed = 0.02;

        this.sprite = sprite;
        this.width = 70;
        this.height = 130;

        // Slight wobble for realism
        this.wobbleTimer = 0;
    }

    update(target) {

        // --- AI steering toward forward direction ---
        // Small wobbling (AI looks real)
        this.wobbleTimer += 0.02;
        const wiggle = Math.sin(this.wobbleTimer) * 0.02;

        this.angle += wiggle;

        // Small random turn left or right
        if (Math.random() < 0.01) {
            this.angle += (Math.random() - 0.5) * 0.5;
        }

        // --- Speed control ---
        if (this.speed < this.maxSpeed) {
            this.speed += 0.05;
        }

        // --- Move AI car ---
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }

    draw(ctx, camera) {
        ctx.save();
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
            ctx.fillStyle = "red";
            ctx.fillRect(-25, -50, 50, 100);
        }

        ctx.restore();
    }
}
