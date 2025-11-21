// =========================
//         CAMERA
// =========================

export default class Camera {
    constructor(racer) {
        this.racer = racer;

        // Camera follows behind racer
        this.position = { x: 0, y: 2.2, z: -5 };
        this.target = { x: 0, y: 1.2, z: 0 };

        // Shake system
        this.shakeIntensity = 0;
        this.shakeTime = 0;

        // FOV dynamics
        this.baseFov = 75;
        this.currentFov = this.baseFov;

        // Smoothness factor
        this.smooth = 0.12;
    }

    triggerShake(intensity = 0.35) {
        this.shakeIntensity = intensity;
        this.shakeTime = 0.4; 
    }

    applyShake(delta) {
        if (this.shakeTime > 0) {
            this.shakeTime -= delta;

            const shakePower = this.shakeIntensity * (this.shakeTime / 0.4);

            this.position.x += (Math.random() - 0.5) * shakePower;
            this.position.y += (Math.random() - 0.5) * shakePower;
        }
    }

    update(delta) {
        // ---- Smooth Follow ----
        const targetX = this.racer.x * 1.25;
        const targetZ = this.racer.position - 5;
        const targetY = 2.2 + (this.racer.speed * 0.014);

        this.position.x += (targetX - this.position.x) * this.smooth;
        this.position.y += (targetY - this.position.y) * this.smooth;
        this.position.z += (targetZ - this.position.z) * this.smooth;

        // ---- Look Ahead ----
        this.target.x = this.racer.x;
        this.target.y = 1.15;
        this.target.z = this.racer.position + 4.5;

        // ---- Speed FOV Boost ----
        const speedFactor = Math.min(this.racer.speed / 40, 1);
        const targetFov = this.baseFov + speedFactor * 12;

        this.currentFov += (targetFov - this.currentFov) * 0.1;

        // ---- Crash Shake ----
        this.applyShake(delta);
    }
}
