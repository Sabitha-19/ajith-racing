export default class PowerUp {
    constructor(image, x, y, type) {
        this.image = image;
        this.x = x;
        this.y = y;
        this.type = type; // "coin", "nitro", "health"
        
        this.width = 60;
        this.height = 60;

        this.spin = 0; // for animation
    }

    update() {
        this.spin += 0.1;
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x + ctx.canvas.width / 2;
        const screenY = this.y - camera.y + ctx.canvas.height / 2;

        ctx.save();
        ctx.translate(screenX + this.width / 2, screenY + this.height / 2);
        ctx.rotate(this.spin);
        ctx.drawImage(
            this.image,
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height
        );
        ctx.restore();
    }
}
