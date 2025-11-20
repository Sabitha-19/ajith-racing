// scripts/Racer.js
export default class Racer {
  constructor(sprite) {
    this.sprite = sprite;

    // initial position (you can set from main.js chooseCountry)
    this.x = window.innerWidth / 2;
    this.y = window.innerHeight / 2;
    this.angle = 0;

    // movement
    this.speed = 0;
    this.acc = 0.25;
    this.maxSpeed = 8;
    this.nitroSpeed = 15;
    this.turnSpeed = 0.045;
    this.friction = 0.94;

    // visual size
    this.width = 70;
    this.height = 130;

    // health & damage
    this.health = 100;
    this.maxHealth = 100;
    this.damageCooldown = 0;

    // nitro resource
    this.nitroTime = 0; // seconds
    this.nitroMax = 1.6;
    this.nitroActive = false;
    this.nitroCooldownTimer = 0;
    this.nitroReady = true;

    // smoke particles for drift
    this.smokeParticles = [];
  }

  // public method to take damage
  takeDamage(amount) {
    if (this.damageCooldown > 0) return;
    this.health -= amount;
    if (this.health < 0) this.health = 0;
    this.damageCooldown = 30; // frames
  }

  // call each frame; input = { steer, throttle, nitro, brake }
  update(input = {}, dt = 1) {
    const steer = input.steer ?? input.x ?? 0;
    const throttle = Math.max(0, input.throttle ?? input.y ?? 0);

    // steering with drift
    let turnAmount = steer * this.turnSpeed;
    if (this.speed > 5) turnAmount *= 1.6;
    this.angle += turnAmount * dt;

    // accelerate / brake
    if (throttle > 0.01) {
      this.speed += this.acc * throttle * dt;
    } else {
      this.speed *= this.friction;
    }

    // nitro activation
    if ((input.nitro || this.nitroActive) && this.nitroReady) {
      if (this.nitroTime <= 0) {
        this.nitroTime = this.nitroMax;
        this.nitroReady = false;
        this.nitroCooldownTimer = this.nitroMax + 2.0; // cooldown
      }
    }

    // nitro active countdown
    if (this.nitroTime > 0) {
      this.nitroTime -= 0.016 * dt;
      this.nitroActive = true;
    } else {
      this.nitroActive = false;
    }

    // cooldown
    if (!this.nitroReady) {
      this.nitroCooldownTimer -= 0.016 * dt;
      if (this.nitroCooldownTimer <= 0) {
        this.nitroReady = true;
        this.nitroCooldownTimer = 0;
      }
    }

    // apply max speed (depending on nitro)
    const currentMax = this.maxSpeed * (this.nitroActive ? (this.nitroSpeed/this.maxSpeed) : 1);
    if (this.speed > currentMax) this.speed = currentMax;

    // move
    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;

    // spawn smoke when drifting
    if (Math.abs(steer) > 0.2 && this.speed > 5) this.createSmoke();

    // update smoke
    this.updateSmoke();

    // damage cooldown tick
    if (this.damageCooldown > 0) this.damageCooldown--;

    // keep width/height for collisions
    this.width = this.width || 70;
    this.height = this.height || 130;
  }

  // smoke helpers
  createSmoke() {
    this.smokeParticles.push({
      x: this.x - Math.cos(this.angle) * 20 + (Math.random()-0.5)*8,
      y: this.y - Math.sin(this.angle) * 20 + (Math.random()-0.5)*8,
      size: 10 + Math.random()*10,
      alpha: 1
    });
    if (this.smokeParticles.length > 60) this.smokeParticles.shift();
  }

  updateSmoke() {
    for (const p of this.smokeParticles) {
      p.size += 0.4;
      p.alpha -= 0.02;
    }
    this.smokeParticles = this.smokeParticles.filter(p => p.alpha > 0);
  }

  drawSmoke(ctx, camera) {
    for (const p of this.smokeParticles) {
      ctx.save();
      ctx.globalAlpha = p.alpha * 0.9;
      ctx.fillStyle = "#bbbbbb";
      ctx.beginPath();
      ctx.arc(p.x - camera.x + window.innerWidth/2, p.y - camera.y + window.innerHeight/2, p.size, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
  }

  draw(ctx, camera) {
    // draw smoke first
    this.drawSmoke(ctx, camera);

    ctx.save();
    const sx = this.x - camera.x + window.innerWidth/2;
    const sy = this.y - camera.y + window.innerHeight/2;
    ctx.translate(sx, sy);
    ctx.rotate(this.angle);

    if (this.sprite && this.sprite.complete) {
      ctx.drawImage(this.sprite, -this.width/2, -this.height/2, this.width, this.height);
    } else {
      ctx.fillStyle = "#00ffd5";
      ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
    }

    // simple windshield
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(-this.width/8, -this.height/2 + 8, this.width/4, this.height/4);

    ctx.restore();
  }
}
