// ===============================================
//                  RACER (PLAYER)
//  Lane-based 3D racer with nitro + drift + FX
// ===============================================

export default class Racer {
    constructor(sprite) {
        this.sprite = sprite;

        // Track-based logic
        this.lane = 0;                  // -1 = left, 0 = center, 1 = right
        this.position = 0;              // Forward on track
        this.targetLane = 0;            // Smooth slide animation

        // Movement physics
        this.speed = 0;
        this.maxSpeed = 18;
        this.accel = 0.25;
        this.brake = 0.4;

        // Nitro mode
        this.nitroActive = false;
        this.nitroTime = 0;
        this.nitroMaxTime = 2.5;        // seconds

        // Drift
        this.drift = 0;

        // Rendering sizes
        this.width = 110;
        this.height = 200;

        // Crash flash effect
        this.crashFlash = 0;
    }

    // --------------------------
    //       INPUT CONTROL
    // --------------------------
    moveLeft() {
        if (this.targetLane > -1) this.targetLane -= 1;
    }

    moveRight() {
        if (this.targetLane < 1) this.targetLane += 1;
    }

    activateNitro() {
        if (!this.nitroActive) {
            this.nitroActive = true;
            this.nitroTime = this.nitroMaxTime;
        }
    }

    // --------------------------
    //         UPDATE
    // --------------------------
    update(delta, controls) {

        // Auto accelerate
        this.speed += this.accel;
        if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;

        // Brake if backward pressed
        if (controls.down) {
            this.speed -= this.brake;
            if (this.speed < 0) this.speed = 0;
        }

        // Lane switching (smooth)
        const laneSpeed = 6 * delta; // smoothness
        this.lane += (this.targetLane - this.lane) * laneSpeed;

        // Drift visual effect
        this.drift += (this.targetLane - this.lane) * 0.08;

        // Nitro update
        if (this.nitroActive) {
            this.speed = this.maxSpeed * 1.45;
            this.nitroTime -= delta;
            if (this.nitroTime <= 0) this.nitroActive = false;
        }

        // Move forward
        this.position += this.speed;

        // Crash flash fade
        if (this.crashFlash > 0) {
            this.crashFlash -= delta * 4;
            if (this.crashFlash < 0) this.crashFlash = 0;
        }
    }

    // --------------------------
    //        POWER UP GET
    // --------------------------
    applyPowerUp(type) {
        if (type === "coin") {
            // main.js increments score
        }
        if (type === "nitro") {
            this.activateNitro();
        }
        if (type === "health") {
            // Add HP here if system added
        }
    }

    // --------------------------
    //           CRASH
    // --------------------------
    crash() {
        this.speed *= 0.4;        // slow player
        this.crashFlash = 1.0;    // full screen flash handled in main.js
    }

    // --------------------------
    //           DRAW
    // --------------------------
    draw(ctx, camera, track) {

        const screen = track.project(this.position, this.lane);
        if (!screen) return;

        ctx.save();
        ctx.translate(screen.x, screen.y);
        ctx.scale(screen.scale, screen.scale);

        // Drift lean
        ctx.rotate(this.drift * 0.15);

        if (this.sprite.complete) {
            ctx.drawImage(
                this.sprite,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
        } else {
            // fallback box
            ctx.fillStyle = "cyan";
            ctx.fillRect(-50, -90, 100, 180);
        }

        ctx.restore();
    }
}
