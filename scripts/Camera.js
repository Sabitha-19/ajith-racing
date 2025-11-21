export default class Camera {
    constructor(target, screenWidth, screenHeight) {
        this.target = target; // Racer object
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;

        this.x = target.x;
        this.y = target.y;

        this.smoothness = 0.1; // Camera follow smoothing
    }

    update() {
        // Smooth follow (lerp)
        this.x += (this.target.x - this.x) * this.smoothness;
        this.y += (this.target.y - this.y) * this.smoothness;
    }

    // Convert world X → screen X
    worldToScreenX(worldX) {
        return worldX - this.x + this.screenWidth / 2;
    }

    // Convert world Y → screen Y
    worldToScreenY(worldY) {
        return worldY - this.y + this.screenHeight / 2;
    }
}
