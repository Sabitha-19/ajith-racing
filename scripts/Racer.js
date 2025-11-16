// scripts/Racer.js
export default class Racer {
  constructor(opts = {}) {
    // world position (float)
    this.x = opts.x ?? window.innerWidth * 0.5;
    this.y = opts.y ?? window.innerHeight * 0.5;

    // heading in radians (0 = right)
    this.angle = opts.angle ?? 0;

    // speed in pixels per tick
    this.speed = 0;

    // tuning
    this.acceleration = 0.18;   // how fast speed rises when throttle applied
    this.brakeFactor = 0.85;    // speed multiplier when no throttle
    this.turnSpeed = 0.045;     // steering influence
    this.maxSpeed = 8.0;        // normal top speed
    this.nitroMultiplier = 2.0; // speed multiplier while nitro
    this.nitroTime = 0.0;       // current nitro time
    this.nitroMax = 1.8;        // seconds of nitro available
    this.nitroCooldown = 2.2;   // seconds cooldown before reuse
    this.nitroReady = true;
    this.nitroCooldownTimer = 0;

    // visual
    this.width = 48;
    this.height = 28;
    this.color = opts.color || "#00ffd5";

    // sprite (optional) - if you provide an Image element assign to this.sprite
    this.sprite = null;
  }

  // call every frame with input: { x: -1..1 (steer), y: -1..1 (throttle), nitro: bool }
  update(input, dt = 1) {
    // dt is optional multiplier (use 1 for requestAnimationFrame loop)
    if (!input) input = { x: 0, y: 0, nitro: false };

    // THROTTLE: input.y > 0 means forward. (our TouchControls sets y in -1..1 with forward positive)
    const throttle = Math.max(0, input.y);

    // accelerate
    if (throttle > 0.01) {
      this.speed += this.acceleration * throttle * dt;
    } else {
      // natural deceleration / friction
      this.speed *= this.brakeFactor;
    }

    // Limit and apply nitro
    if (input.nitro && this.nitroReady) {
      // start nitro if not already
      if (this.nitroTime <= 0) {
        this.nitroTime = this.nitroMax;
        this.nitroReady = false;
        this.nitroCooldownTimer = this.nitroCooldown + this.nitroMax;
      }
    }

    // if nitro active reduce nitroTime
    if (this.nitroTime > 0) {
      this.nitroTime -= 0.016 * dt; // approx seconds
    }

    // cooldown timer reduces even when nitro active (so total lockout is cooldown+nitro)
    if (!this.nitroReady) {
      this.nitroCooldownTimer -= 0.016 * dt;
      if (this.nitroCooldownTimer <= 0) {
        this.nitroReady = true;
        this.nitroCooldownTimer = 0;
      }
    }

    const nitroActive = this.nitroTime > 0;

    const currentMax = this.maxSpeed * (nitroActive ? this.nitroMultiplier : 1);

    if (this.speed > currentMax) this.speed = currentMax;

    // Steering: steering efficiency increases with speed (so steering feels natural)
    const steerAmount = input.x || 0;
    this.angle += steerAmount * this.turnSpeed * (0.6 + (Math.min(this.speed, currentMax) / currentMax)) * dt;

    // Move forward along heading
    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;

    // Keep inside world bounds (wrap or clamp depending on preference) — we'll clamp slightly inside
    const margin = 20;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.x = Math.max(margin, Math.min(w - margin, this.x));
    this.y = Math.max(margin, Math.min(h - margin, this.y));
  }

  // draw on 2D canvas context (ctx) — camera should have translated the canvas appropriately
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    if (this.sprite && this.sprite.complete) {
      // if you provided an Image for sprite, draw it centered
      ctx.drawImage(this.sprite, -this.width / 2, -this.height / 2, this.width, this.height);
    } else {
      // fallback simple car shape (rounded rect + windshield)
      ctx.fillStyle = this.color;
      roundRect(ctx, -this.width / 2, -this.height / 2, this.width, this.height, 6, true, false);

      // windshield
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(-this.width / 8, -this.height / 2 + 3, this.width / 4, this.height / 3);
    }

    // nitro glow indicator (behind car)
    if (this.nitroTime > 0) {
      const glow = Math.max(0.1, this.nitroTime / this.nitroMax);
      ctx.globalAlpha = 0.6 * glow;
      ctx.fillStyle = "orange";
      ctx.fillRect(-6, this.height / 2, 12, 10 + glow * 12);
      ctx.globalAlpha = 1.0;
    }

    ctx.restore();
  }
}

// small helper to draw rounded rect
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  if (typeof r === "undefined") r = 5;
  if (typeof stroke === "undefined") stroke = true;
  if (typeof fill === "undefined") fill = true;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}
