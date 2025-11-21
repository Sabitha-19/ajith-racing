// scripts/Racer.js
// ES module — default export
// Racer handles movement, drifting, nitro, health, crash flash and smoke particles.
// Compatible with Camera (camera.x/camera.y) and TouchControls.getKeys() style input.

export default class Racer {
  /**
   * @param {HTMLImageElement|null} sprite - racer sprite image (can be null)
   * @param {object} opts - optional tuning values
   */
  constructor(sprite = null, opts = {}) {
    this.sprite = sprite;

    // Position (world coords)
    this.x = opts.x ?? window.innerWidth / 2;
    this.y = opts.y ?? window.innerHeight / 2;

    // Orientation & movement
    this.angle = 0;            // radians
    this.speed = 0;            // current speed
    this.acc = opts.acc ?? 0.28;
    this.maxSpeed = opts.maxSpeed ?? 8;
    this.reverseMax = opts.reverseMax ?? -3;
    this.friction = opts.friction ?? 0.94;

    // Turning / drifting
    this.turnBase = opts.turnBase ?? 0.045;
    this.driftMultiplier = opts.driftMultiplier ?? 1.6; // sharper turns at high speed
    this.sideSlip = opts.sideSlip ?? 0.88; // visual drifting slippage factor

    // Nitro
    this.nitroMax = opts.nitroMax ?? 1.6; // seconds of nitro
    this.nitroTime = 0;
    this.nitroActive = false;
    this.nitroBoost = opts.nitroBoost ?? 1.9; // speed multiplier while nitro
    this.nitroCooldown = 0;

    // Dimensions (for collisions)
    this.width = opts.width ?? 70;
    this.height = opts.height ?? 130;

    // Health & damage
    this.health = opts.health ?? 100;
    this.maxHealth = opts.maxHealth ?? 100;
    this.damageCooldown = 0;

    // Visual effects
    this.smokeParticles = []; // little drifting smoke particles
    this.maxSmoke = 80;

    // Crash / flash
    this.isCrashed = false;

    // Gameplay bookkeeping
    this.coins = 0;
    this.score = 0;
  }

  // --- Damage API (respects global debug god mode if set) ---
  takeDamage(amount = 10) {
    if (window.debug?.godMode) return; // debug bypass
    if (this.damageCooldown > 0) return;

    this.health -= amount;
    if (this.health < 0) this.health = 0;
    this.damageCooldown = 30; // frames

    // crash flash visual
    this._flashScreen();

    // small slow-down on hit
    this.speed *= 0.4;
  }

  heal(amount = 10) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  _flashScreen() {
    // quick red flash overlay appended to body
    try {
      const flash = document.createElement("div");
      flash.style.position = "fixed";
      flash.style.top = "0";
      flash.style.left = "0";
      flash.style.width = "100%";
      flash.style.height = "100%";
      flash.style.background = "rgba(255,0,0,0.28)";
      flash.style.zIndex = 99999;
      flash.style.pointerEvents = "none";
      document.body.appendChild(flash);
      setTimeout(() => document.body.removeChild(flash), 140);
    } catch (e) {
      // ignore (e.g., running in non-browser tests)
    }
  }

  // --- Nitro activation (call from input) ---
  startNitro() {
    if (this.nitroTime <= 0 && this.nitroCooldown <= 0) {
      this.nitroTime = this.nitroMax;
      this.nitroActive = true;
      this.nitroCooldown = this.nitroMax + 1.8; // cooldown period
    }
  }

  // --- Per-frame update ---
  // input object shape: { steer: -1..1, throttle: 0..1, nitro: boolean, brake: boolean }
  update(input = {}, dt = 1) {
    const steer = input.steer ?? 0;
    const throttle = Math.max(0, input.throttle ?? 0);
    const brake = !!input.brake;
    const nitroPressed = !!input.nitro;

    // handle nitro request
    if (nitroPressed && this.nitroCooldown <= 0 && this.nitroTime <= 0) {
      this.startNitro();
    }

    // Nitro countdown
    if (this.nitroTime > 0) {
      this.nitroTime -= 0.016 * dt;
      this.nitroActive = true;
    } else {
      this.nitroActive = false;
      if (this.nitroCooldown > 0) this.nitroCooldown -= 0.016 * dt;
      if (this.nitroCooldown < 0) this.nitroCooldown = 0;
    }

    // Acceleration / braking
    if (throttle > 0.01) {
      this.speed += this.acc * throttle * dt;
    } else if (brake) {
      // stronger deceleration on brake
      this.speed -= this.acc * 1.6 * dt;
    } else {
      // natural friction when neither accelerating nor braking
      this.speed *= this.friction;
    }

    // Apply nitro effect to max allowed speed (not additive to speed)
    const speedLimit = this.nitroActive ? this.maxSpeed * this.nitroBoost : this.maxSpeed;
    if (this.speed > speedLimit) this.speed = speedLimit;
    if (this.speed < this.reverseMax) this.speed = this.reverseMax;

    // Steering with drifting behavior
    let turnAmount = steer * this.turnBase;
    if (Math.abs(this.speed) > 5) turnAmount *= this.driftMultiplier;
    this.angle += turnAmount * dt;

    // Movement: forward relative to angle. Side slip gives drifting feel visually.
    const forwardX = Math.cos(this.angle) * this.speed * dt;
    const forwardY = Math.sin(this.angle) * this.speed * dt;
    const slipX = Math.cos(this.angle + Math.PI / 2) * (this.speed * (1 - this.sideSlip) * 0.5);
    const slipY = Math.sin(this.angle + Math.PI / 2) * (this.speed * (1 - this.sideSlip) * 0.5);

    // Combine forward and small lateral slip based on steering
    this.x += forwardX + slipX * steer;
    this.y += forwardY + slipY * steer;

    // Spawn smoke when drifting
    if (Math.abs(steer) > 0.2 && Math.abs(this.speed) > 4) this._spawnSmoke();

    // Update smoke particles
    this._updateSmoke();

    // damage cooldown tick
    if (this.damageCooldown > 0) this.damageCooldown--;

    // keep sizes defined for collision checks
    this.width = this.width || 70;
    this.height = this.height || 130;
  }

  // --- Smoke particle helpers ---
  _spawnSmoke() {
    this.smokeParticles.push({
      x: this.x - Math.cos(this.angle) * 18 + (Math.random() - 0.5) * 8,
      y: this.y - Math.sin(this.angle) * 18 + (Math.random() - 0.5) * 8,
      size: 6 + Math.random() * 8,
      alpha: 1,
      life: 40 + Math.random() * 20
    });
    if (this.smokeParticles.length > this.maxSmoke) this.smokeParticles.shift();
  }

  _updateSmoke() {
    for (let p of this.smokeParticles) {
      p.size += 0.3;
      p.alpha -= 0.02;
      p.life -= 1;
    }
    this.smokeParticles = this.smokeParticles.filter(p => p.alpha > 0 && p.life > 0);
  }

  // --- Draw helpers ---
  // camera: object with x,y positions (top-left of viewport in world coords)
  drawSmoke(ctx, camera) {
    for (let p of this.smokeParticles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha * 0.9);
      ctx.beginPath();
      const sx = p.x - (camera?.x ?? 0) + window.innerWidth / 2;
      const sy = p.y - (camera?.y ?? 0) + window.innerHeight / 2;
      ctx.fillStyle = "#bfbfbf";
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  draw(ctx, camera) {
    // draw smoke behind the car (so smoke appears under car)
    this.drawSmoke(ctx, camera);

    ctx.save();

    // convert world -> screen using camera
    const sx = this.x - (camera?.x ?? 0) + window.innerWidth / 2;
    const sy = this.y - (camera?.y ?? 0) + window.innerHeight / 2;

    ctx.translate(sx, sy);
    ctx.rotate(this.angle);

    // draw car sprite or fallback rectangle
    if (this.sprite && this.sprite.complete) {
      ctx.drawImage(this.sprite, -this.width / 2, -this.height / 2, this.width, this.height);
    } else {
      // body
      ctx.fillStyle = "#00aaff";
      ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
      // windshield
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(-this.width / 8, -this.height / 2 + 8, this.width / 4, this.height / 4);
    }

    // nitro flame (rear)
    if (this.nitroActive) {
      ctx.save();
      ctx.fillStyle = "rgba(255,160,0,0.95)";
      // flicker flame shape
      ctx.beginPath();
      ctx.moveTo( -8, this.height / 2 );
      ctx.quadraticCurveTo( 0, this.height / 2 + 20 + Math.random()*8, 8, this.height / 2 );
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }
}

