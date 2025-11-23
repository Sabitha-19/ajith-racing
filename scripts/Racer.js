// scripts/Racer.js
// Lane-based 2D Racer (player)
// Exposes:
//  - properties: position, lane, targetLane, speed, width, height
//  - methods: update(delta, controls), draw(ctx, camera, track), applyPowerUp(type), crash()
//
// Designed to work with Track.project(position, lane) => { x, y, scale }
// and RacerGame.js / TouchControls.js interfaces.

export default class Racer {
    constructor(sprite = null) {
        // sprite: Image instance (optional)
        this.sprite = sprite;

        // track-space
        this.position = 0;     // forward distance along track
        this.lane = 0;         // -1 left, 0 center, +1 right
        this.targetLane = 0;   // for smooth lane switching

        // movement
        this.speed = 0;        // current forward speed
        this.accel = 6.0;      // units per second^2 (tune)
        this.maxSpeed = 18.0;  // base max speed
        this.brakePower = 18.0;
        this.friction = 0.98;

        // nitro
        this.nitroActive = false;
        this.nitroTime = 0;
        this.nitroDuration = 2.0;     // seconds
        this.nitroMultiplier = 1.6;   // speed multiplier

        // drift / visual lean
        this.lean = 0;

        // dimensions (world-space sizes used for collision scaling)
        this.width = 110;
        this.height = 200;

        // health / damage (optional; not used by basic engine)
        this.health = 100;

        // crash flash (for screen overlay; main engine reads this.playerCrashFlash)
        this.crashFlash = 0;

        // coins or score
        this.coins = 0;
    }

    // external calls to move lanes
    moveLeft() {
        if (this.targetLane > -1) this.targetLane -= 1;
    }

    moveRight() {
        if (this.targetLane < 1) this.targetLane += 1;
    }

    activateNitro() {
        if (!this.nitroActive && this.nitroTime <= 0) {
            this.nitroActive = true;
            this.nitroTime = this.nitroDuration;
        }
    }

    // apply a power-up effect
    applyPowerUp(type) {
        if (!type) return;
        if (type === "coin") {
            this.coins = (this.coins || 0) + 1;
        } else if (type === "nitro") {
            // immediate small boost; also start nitro timer
            this.nitroTime = Math.max(this.nitroTime, this.nitroDuration);
            this.nitroActive = true;
        } else if (type === "health") {
            this.health = Math.min(100, (this.health || 100) + 20);
        }
    }

    // slows down & flash on crash
    crash() {
        this.speed = Math.max(0, this.speed * 0.35);
        this.crashFlash = 1.0;
    }

    // update each frame: delta in seconds, controls object { left, right, down, nitro }
    update(delta = 1 / 60, controls = {}) {
        // -------------------------
        // input handling
        // -------------------------
        if (controls.left) {
            this.moveLeft();
            // small immediate lateral lean
            this.lean = Math.max(this.lean - 0.08, -1.6);
        } else if (controls.right) {
            this.moveRight();
            this.lean = Math.min(this.lean + 0.08, 1.6);
        } else {
            // relax lean slowly
            this.lean *= 0.92;
        }

        if (controls.nitro || this.nitroActive) {
            if (!this.nitroActive && controls.nitro) {
                this.activateNitro();
            }
        }

        // -------------------------
        // speed & nitro logic
        // -------------------------
        // accelerate automatically (arcade feel)
        this.speed += this.accel * delta;
        // basic braking input (down)
        if (controls.down) {
            this.speed -= this.brakePower * delta;
        }

        // friction clamp
        this.speed *= Math.pow(this.friction, delta * 60);

        // nitro effect
        if (this.nitroActive && this.nitroTime > 0) {
            this.nitroTime -= delta;
            // scale speed smoothly
            const targetMax = this.maxSpeed * this.nitroMultiplier;
            if (this.speed < targetMax) {
                this.speed = Math.min(targetMax, this.speed + this.accel * 2 * delta);
            }
        } else {
            this.nitroActive = false;
            if (this.nitroTime <= 0) this.nitroTime = 0;
        }

        // clamp speed to max (depending on nitro)
        const effectiveMax = this.nitroActive ? this.maxSpeed * this.nitroMultiplier : this.maxSpeed;
        if (this.speed > effectiveMax) this.speed = effectiveMax;
        if (this.speed < 0) this.speed = 0;

        // -------------------------
        // lane smoothing (interpolate lane -> targetLane)
        // -------------------------
        const laneLerpSpeed = 6.0 * delta; // how fast lane position follows targetLane
        this.lane += (this.targetLane - this.lane) * Math.min(1, laneLerpSpeed);

        // -------------------------
        // forward movement
        // -------------------------
        this.position += this.speed * delta * 60; // multiply to keep units meaningful (tweakable)
        // NOTE: RacerGame/Track treat position as same units

        // -------------------------
        // crash flash decay
        // -------------------------
        if (this.crashFlash > 0) {
            this.crashFlash = Math.max(0, this.crashFlash - delta * 1.5);
        }
    }

    // Draw the racer at projected screen position
    // ctx: CanvasRenderingContext2D
    // camera: object with world->screen helpers or ignored (we use track.project)
    // track: Track instance with project(position, lane) => { x, y, scale }
    draw(ctx, camera, track) {
        if (!track) return;

        const screen = track.project(this.position, this.lane);
        if (!screen) return;

        const { x, y, scale } = screen;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // visual lean rotation
        ctx.rotate(this.lean * 0.06);

        // draw sprite or fallback rect
        const drawW = this.width;
        const drawH = this.height;

        if (this.sprite && this.sprite.complete) {
            ctx.drawImage(this.sprite, -drawW / 2, -drawH / 2, drawW, drawH);
        } else {
            ctx.fillStyle = "#00ffd5";
            ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
        }

        // simple windshield
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(-drawW * 0.12, -drawH * 0.45, drawW * 0.24, drawH * 0.18);

        // small nitro flame under car when active
        if (this.nitroActive) {
            ctx.save();
            ctx.translate(0, drawH * 0.5);
            // flame sprite if provided as global asset (RacerGame draws additional flame effect too)
            if (typeof window !== "undefined" && window.__assets && window.__assets.flame) {
                const flameImg = window.__assets.flame;
                if (flameImg.complete) {
                    ctx.globalAlpha = 0.9;
                    ctx.drawImage(flameImg, -drawW * 0.24, 0, drawW * 0.48, drawH * 0.6);
                }
            } else {
                ctx.fillStyle = "rgba(255,120,0,0.9)";
                ctx.beginPath();
                ctx.ellipse(0, 8, drawW * 0.18, drawH * 0.12, 0, 0, Math.PI);
                ctx.fill();
            }
            ctx.restore();
        }

        ctx.restore();
    }
}
