// scripts/Camera.js
// Simple follow-camera for 2D racing game
// Tracks the player along the track and provides screen offset for rendering

export default class Camera {
    constructor(followTarget = null, canvasHeight = 600) {
        this.target = followTarget; // Racer instance
        this.offsetY = 0;           // camera scroll in track units
        this.lerpSpeed = 0.08;      // smooth following
        this.canvasHeight = canvasHeight;
    }

    update(delta = 1 / 60) {
        if (!this.target) return;

        // target position for camera: keep player around 30% from bottom
        const targetOffset = this.target.position - this.canvasHeight * 0.3;
        this.offsetY += (targetOffset - this.offsetY) * this.lerpSpeed;
    }

    // Project world coordinates to screen
    project(x, y, scale = 1) {
        // in 2D top-down: x is lane offset, y is position along track
        const screenX = x;
        const screenY = y - this.offsetY;
        return { x: screenX, y: screenY, scale };
    }
}
