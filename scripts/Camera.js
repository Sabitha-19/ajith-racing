// scripts/Camera.js
// Simple follow-camera for 2D racing game

export default class Camera {
    constructor(followTarget = null, canvas) {
        this.target = followTarget; 
        this.offsetY = 0;           // camera scroll in track units
        this.lerpSpeed = 0.08;      // smooth following
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;
    }

    update(delta = 1 / 60) {
        if (!this.target) return;

        // Player's Y position is fixed on screen (e.g., this.target.y = 600)
        // Camera tracks player's *world position* (this.target.position)
        // target offset: keep player's fixed screen Y aligned with their world position
        
        // Calculate the world position the camera needs to be focused on
        const targetWorldPosition = this.target.position - (this.canvasHeight - this.target.y);
        
        // Smoothly move the camera offset towards the target world position
        this.offsetY += (targetWorldPosition - this.offsetY) * this.lerpSpeed * (delta * 60); 
    }

    // Project world coordinates to screen
    project(worldX, worldY) {
        const screenX = worldX + this.canvasWidth / 2; // Centralize X axis
        const screenY = worldY - this.offsetY; 
        return { x: screenX, y: screenY };
    }
}
