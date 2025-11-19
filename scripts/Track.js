export default class Track {
    constructor(roadImage) {
        this.sprite = roadImage;

        // Each road tile size
        this.tileWidth = 800;
        this.tileHeight = 800;

        // Create a giant looping grid (3x3 tiles)
        this.tiles = [];
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                this.tiles.push({ x, y });
            }
        }
    }

    update(racer) {
        // Shift road tiles when racer moves far
        this.tiles.forEach(tile => {
            const worldX = tile.x * this.tileWidth;
            const worldY = tile.y * this.tileHeight;

            // Reposition tile if car crosses it
            if (racer.x - worldX > this.tileWidth) tile.x += 3;
            if (racer.x - worldX < -this.tileWidth) tile.x -= 3;

            if (racer.y - worldY > this.tileHeight) tile.y += 3;
            if (racer.y - worldY < -this.tileHeight) tile.y -= 3;
        });
    }

    draw(ctx, camera) {
    const w = this.image.width;
    const h = this.image.height;

    const screenX = -camera.x + ctx.canvas.width / 2;
    const screenY = -camera.y + ctx.canvas.height / 2;

    // Draw looping road tiles
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            ctx.drawImage(
                this.image,
                screenX + x * w,
                screenY + y * h,
                w,
                h
            );
        }
    }

    // ---- START LINE ----
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.fillStyle = "white";
    ctx.fillRect(-50, -300, 300, 20); // horizontal start line
    ctx.restore();

    // ---- FINISH LINE ----
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.fillStyle = "yellow";
    ctx.fillRect(1000, 800, 300, 20); // finish line
    ctx.restore();
}

