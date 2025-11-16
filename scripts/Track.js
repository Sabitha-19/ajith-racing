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
        this.tiles.forEach(tile => {
            const drawX =
                tile.x * this.tileWidth -
                camera.x +
                window.innerWidth / 2;

            const drawY =
                tile.y * this.tileHeight -
                camera.y +
                window.innerHeight / 2;

            if (this.sprite.complete) {
                ctx.drawImage(
                    this.sprite,
                    drawX,
                    drawY,
                    this.tileWidth,
                    this.tileHeight
                );
            } else {
                // Fallback green ground
                ctx.fillStyle = "#208020";
                ctx.fillRect(drawX, drawY, this.tileWidth, this.tileHeight);
            }
        });
    }
}

