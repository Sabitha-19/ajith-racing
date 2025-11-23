// scripts/Camera.js
// Simple 2D follow camera for lane-based racing
// Works with Racer.js, Enemy.js, Track.js

export default class Camera {
    constructor(target = null) {
        this.target = target; // usually player racer
        this.x = 0;
        this.y = 0;
        this.z = 0;

        // smooth follow parameters
        this.lerpFactor = 0.08;
        this.yOffset = -100;  // vertical offset (optional)
        this.zOffset = -300;  // distance behind player
    }

    // call each frame
    update() {
        if (!this.target) return;

        // smooth follow X (lane offset)
        const targetScreenX = this.target.lane * 200; // lane spacing in pixels
        this.x += (targetScreenX - this.x) * this.lerpFactor;

        // smooth follow Z (distance behind)
        const targetZ = this.target.position + this.zOffset;
        this.z += (targetZ - this.z) * this.lerpFactor;

        // smooth follow Y (vertical, optional)
        const targetY = this.target.height / 2 + this.yOffset;
        this.y += (targetY - this.y) * this.lerpFactor;
    }

    // optional: get camera object for Track.project
    getView() {
        return { x: this.x, y: this.y, z: this.z };
    }
}
