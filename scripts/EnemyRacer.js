export default class EnemyRacer {
    constructor(x, y, color = "red") {
        this.x = x;
        this.y = y;
        this.speed = 6; // slower than player
        this.width = 40;
        this.height = 70;
        this.color = color;

        // AI behavior
        this.steerTimer = 0;
        this.steerDirection = 0;
    }

    update(track) {
        // Move forward along the track
        this.y -= this.speed;

        // AI random steering
        this.steerTimer--;
        if (this.steerTimer <= 0) {
            this.steerTimer = 60 + Math.random() * 120;
            this.steerDirection = (Math.random() - 0.5) * 6; // small left-right drift
        }

        this.x += this.steerDirection;

        // Stay inside road boundaries
        const roadLeft = track.roadX - track.roadWidth / 2 + 40;
        const roadRight = track.roadX + track.roadWidth / 2 - 40;

        if (this.x < roadLeft) this.x = roadLeft;
        if (this.x > roadRight) this.x = roadRight;
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x + ctx.canvas.width / 2;
        const screenY = this.y - camera.y + ctx.canvas.height / 2;

        ctx.fillStyle = this.color;
        ctx.fillRect(screenX - this.width / 2, screenY - this.height / 2, this.width, this.height);
    }
}
