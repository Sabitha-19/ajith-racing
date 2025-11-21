// ================================
//             RACER
// ================================

export default class Racer {
    constructor(sprite) {
        this.sprite = sprite;

        // Track-based position
        this.position = 0;    // forward movement on the road
        this.lane = 0;        // -1 left, 0 center, 1 right
        this.targetLane = 0;  // smooth lane movement
        
        // Physical movement
        this.speed = 0;
        this.maxSpeed = 18;
        this.acc = 0.25;
        this.friction = 0.96;

        // Steering & turn lean
        this.turnLean = 0;

        // Nitro system
        this.nitroActive = false;
        this.nitroTime = 0;
        this.nitroMax = 1.6;
        this.nitroReady = true;
        this.nitroCooldown = 0;

        // Health
        this.health = 100;
        this.damageTimer = 0;

        // Car dimensions
        this.width = 160;
        this.height = 340;

        // Flame effects
        this.flames = [];

        // Screen flash for crash
        this.screenFlash = 0;

        // Debug tools
        this.debugMode = false;
    }

    takeDamage(amount) {
        if (this.damageTimer > 0) return;

        this.health -= amount;
        if (this.health < 0) this.health = 0;

        // Flash white effect
        this.screenFlash = 12;

        // Knockback effect
        this.speed *= 0.6;

        // Damage cooldown
        this.damageTimer = 30;
    }

    update(input, delta, track) {

        // -----------------------
        // Handle Lane Switching
        // -----------------------
        if (input.left) this.targetLane = Math.max(-1, this.targetLane - 1);
        if (input.right) this.targetLane = Math.min(1, this.targetLane + 1);

        // Smooth transition between lanes
        this.lane += (this.targetLane - this.lane) * 0.15;

        // -----------------------
        // Acceleration & Speed
        // -----------------------
        if (input.forward) {
            this.speed += this.acc;
        } else {
            this.speed *= this.friction;
        }

        if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
        if (this.speed < 0) this.speed = 0;

        // -----------------------
        // Nitro Logic
        // -----------------------
        if (input.nitro && this.nitroReady) {
            this.nitroTime = this.nitroMax;
            this.nitroActive = true;
            this.nitroReady = false;
            this.nitroCooldown = this.nitroMax + 2.0;
        }

        if (this.nitroTime > 0) {
            this.nitroTime -= delta;
            this.speed += 0.5; // temporary boost
            this.spawnFlame();
        } else {
            this.nitroActive = false;
        }

        if (!this.nitroReady) {
            this.nitroCooldown -= delta;
            if (this.nitroCooldown <= 0) {
                this.nitroReady = true;
            }
        }

        // -----------------------
        // Drifting Lean
        // -----------------------
        if (input.left) this.turnLean = -0.15;
        else if (input.right) this.turnLean = 0.15;
        else this.turnLean *= 0.8;

        // -----------------------
        // Move Forward
        // -----------------------
        this.position += this.speed * delta;

        // -----------------------
        // Update flame particles
        // -----------------------
        this.updateFlames();

        // Damage cooldown
        if (this.damageTimer > 0) this.damageTimer--;

        // Reduce screen flash
        if (this.screenFlash > 0) this.screenFlash--;
    }

    spawnFlame() {
        this.flames.push({
            x: (Math.random() - 0.5) * 30,
            y: 120,
            size: 20 + Math.random() * 20,
            alpha: 1
        });
        if (this.flames.length > 40) this.flames.shift();
    }

    updateFlames() {
        for (let f of this.flames) {
            f.size += 0.5;
            f.alpha -= 0.05;
        }
        this.flames = this.flames.filter(f => f.alpha > 0);
    }

    draw(ctx, track) {
        // Project onto screen
        const screen = track.project(this.position, this.lane);
        const x = screen.x;
        const y = screen.y;
        const scale = screen.scale;

        // -----------------------
        // Draw flames (behind car)
        // -----------------------
        for (let f of this.flames) {
            ctx.save();
            ctx.globalAlpha = f.alpha;
            ctx.fillStyle = "orange";

            ctx.beginPath();
            ctx.arc(
                x + f.x * scale,
                y + f.y * scale,
                f.size * scale,
                0,
                Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
        }

        // -----------------------
        // Draw car itself
        // -----------------------
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.rotate(this.turnLean);

        if (this.sprite.complete)
            ctx.drawImage(this.sprite, -this.width / 2, -this.height / 2, this.width, this.height);
        else {
            ctx.fillStyle = "#00d2ff";
            ctx.fillRect(-80, -170, 160, 340);
        }

        ctx.restore();

        // -----------------------
        // Crash flash overlay
        // -----------------------
        if (this.screenFlash > 0) {
            ctx.save();
            ctx.globalAlpha = this.screenFlash / 20;
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();
        }
    }
}
