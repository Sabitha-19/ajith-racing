// scripts/Racer.js
export default class Racer {
    constructor(sprite = null) {
        this.sprite = sprite;
        this.position = 0;
        this.lane = 0;
        this.targetLane = 0;
        this.speed = 0;
        this.accel = 6.0;
        this.maxSpeed = 18.0;
        this.brakePower = 18.0;
        this.friction = 0.98;

        this.nitroActive = false;
        this.nitroTime = 0;
        this.nitroDuration = 2.0;
        this.nitroMultiplier = 1.6;

        this.lean = 0;
        this.width = 110;
        this.height = 200;
        this.health = 100;
        this.crashFlash = 0;
        this.coins = 0;
    }

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

    applyPowerUp(type) {
        if (!type) return;
        if (type === "coin") this.coins = (this.coins || 0) + 1;
        else if (type === "nitro") {
            this.nitroTime = Math.max(this.nitroTime, this.nitroDuration);
            this.nitroActive = true;
        }
        else if (type === "health") this.health = Math.min(100, (this.health || 100) + 20);
    }

    crash() {
        this.speed = Math.max(0, this.speed * 0.35);
        this.crashFlash = 1.0;
    }

    update(delta = 1 / 60, controls = {}) {
        if (controls.left) {
            this.moveLeft();
            this.lean = Math.max(this.lean - 0.08, -1.6);
        } else if (controls.right) {
            this.moveRight();
            this.lean = Math.min(this.lean + 0.08, 1.6);
        } else this.lean *= 0.92;

        if (controls.nitro || this.nitroActive) {
            if (!this.nitroActive && controls.nitro) this.activateNitro();
        }

        this.speed += this.accel * delta;
        if (controls.down) this.speed -= this.brakePower * delta;
        this.speed *= Math.pow(this.friction, delta * 60);

        if (this.nitroActive && this.nitroTime > 0) {
            this.nitroTime -= delta;
            const targetMax = this.maxSpeed * this.nitroMultiplier;
            if (this.speed < targetMax) this.speed = Math.min(targetMax, this.speed + this.accel * 2 * delta);
        } else {
            this.nitroActive = false;
            if (this.nitroTime <= 0) this.nitroTime = 0;
        }

        const effectiveMax = this.nitroActive ? this.maxSpeed * this.nitroMultiplier : this.maxSpeed;
        if (this.speed > effectiveMax) this.speed = effectiveMax;
        if (this.speed < 0) this.speed = 0;

        const laneLerpSpeed = 6.0 * delta;
        this.lane += (this.targetLane - this.lane) * Math.min(1, laneLerpSpeed);

        this.position += this.speed * delta * 60;

        if (this.crashFlash > 0) this.crashFlash = Math.max(0, this.crashFlash - delta * 1.5);
    }

    draw(ctx, camera, track) {
        if (!track) return;
        const screen = track.project(this.position, this.lane);
        if (!screen) return;

        const { x, y, scale } = screen;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.rotate(this.lean * 0.06);

        const drawW = this.width;
        const drawH = this.height;

        if (this.sprite && this.sprite.complete) ctx.drawImage(this.sprite, -drawW / 2, -drawH / 2, drawW, drawH);
        else {
            ctx.fillStyle = "#00ffd5";
            ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
        }

        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(-drawW * 0.12, -drawH * 0.45, drawW * 0.24, drawH * 0.18);

        if (this.nitroActive) {
            ctx.save();
            ctx.translate(0, drawH * 0.5);
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
