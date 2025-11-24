// scripts/camera.js

export default class Camera {
    /**
     * Camera constructor initializes the viewport dimensions and position.
     * @param {number} canvasWidth - The width of the drawing canvas.
     * @param {number} canvasHeight - The height of the drawing canvas.
     */
    constructor(canvasWidth, canvasHeight) {
        this.viewportW = canvasWidth;
        this.viewportH = canvasHeight;
        
        // Camera position (top-left corner of the viewport in world coordinates)
        this.x = 0;
        this.y = 0;

        // Target object the camera should follow
        this.target = null;
        
        // Offset to keep the target centered or slightly below center (common for top-down racers)
        this.offsetX = 0;
        this.offsetY = canvasHeight * 0.75; // 75% down the screen
        
        // World boundaries (optional, to stop camera from panning off the edges)
        this.worldW = 0;
        this.worldH = 0;
    }

    /**
     * Sets the object the camera should follow and the world boundaries.
     * @param {object} target - The object to follow (must have x and y properties).
     * @param {number} worldW - The width of the game world.
     * @param {number} worldH - The height of the game world.
     */
    setTarget(target, worldW, worldH) {
        this.target = target;
        this.worldW = worldW;
        this.worldH = worldH;
    }

    /**
     * Updates the camera position based on the target's position.
     */
    update() {
        if (!this.target) return;

        // 1. Calculate the desired position
        // The camera's x/y should be positioned so the target is at (offsetX, offsetY) on the viewport.
        let targetX = this.target.x - this.offsetX;
        let targetY = this.target.y - this.offsetY;

        // 2. Smoothly move the camera toward the target (optional smoothing)
        // For a simple racer, direct following is often preferred for tight controls.
        this.x = targetX;
        this.y = targetY;


        // 3. Clamp camera position to world boundaries
        // Prevent panning off the left/top edges
        this.x = Math.max(0, this.x);
        this.y = Math.max(0, this.y);

        // Prevent panning off the right/bottom edges
        if (this.worldW > 0 && this.worldH > 0) {
            this.x = Math.min(this.x, this.worldW - this.viewportW);
            this.y = Math.min(this.y, this.worldH - this.viewportH);
        }
    }

    /**
     * Translates world coordinates (x, y) to screen coordinates.
     * This is used before drawing any world object.
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
     */
    applyTransform(ctx) {
        // Translate the canvas context by the inverse of the camera's position.
        // This makes everything drawn afterward appear relative to the camera view.
        ctx.translate(-this.x, -this.y);
    }

    /**
     * Resets the canvas translation after drawing the world elements.
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
     */
    resetTransform(ctx) {
        // Reset the translation to ensure UI elements (HUD) are drawn correctly
        ctx.setTransform(1, 0, 0, 1, 0, 0); 
    }
}
