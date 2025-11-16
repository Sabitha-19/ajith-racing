// scripts/Track.js
export default class Track {
  constructor(opts = {}) {
    this.centerX = opts.centerX ?? window.innerWidth / 2;
    this.centerY = opts.centerY ?? window.innerHeight / 2;
    this.radius = opts.radius ?? Math.min(window.innerWidth, window.innerHeight) * 0.36;
    this.width = opts.width ?? 120; // track width in px
    this.segments = opts.segments ?? 72;
    this.checkpoints = []; // computed points around circle
    this.computeCheckpoints();
  }

  computeCheckpoints() {
    this.checkpoints = [];
    for (let i = 0; i < this.segments; i++) {
      const a = (i / this.segments) * Math.PI * 2;
      const px = this.centerX + Math.cos(a) * this.radius;
      const py = this.centerY + Math.sin(a) * this.radius;
      this.checkpoints.push({ x: px, y: py, angle: a });
    }
  }

  // draw the background + track onto ctx
  draw(ctx) {
    // background
    const g = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    g.addColorStop(0, "#0a0f1a");
    g.addColorStop(1, "#081019");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // track shadow (outer)
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.radius + this.width / 2 + 6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fill();

    // track surface (dark)
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
    ctx.lineWidth = this.width;
    ctx.strokeStyle = "#2b2b2b";
    ctx.stroke();

    // track inner rim highlight
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.radius - this.width / 2 + 6, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.02)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // dashed center guide (for style)
    ctx.setLineDash([10, 14]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // small decorative objects (trees/markers)
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const px = this.centerX + Math.cos(a) * (this.radius + this.width / 2 + 18);
      const py = this.centerY + Math.sin(a) * (this.radius + this.width / 2 + 18);
      drawMarker(ctx, px, py);
    }
  }

  // returns a good starting position (on the track inner lane)
  getStartPosition() {
    const a = 0.0;
    const px = this.centerX + Math.cos(a) * (this.radius - this.width * 0.25);
    const py = this.centerY + Math.sin(a) * (this.radius - this.width * 0.25);
    return { x: px, y: py, angle: a };
  }
}

function drawMarker(ctx, x, y) {
  ctx.fillStyle = "#1b8b3b";
  ctx.beginPath();
  ctx.ellipse(x, y - 6, 6, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0f5a29";
  ctx.fillRect(x - 2, y + 2, 4, 6);
}
