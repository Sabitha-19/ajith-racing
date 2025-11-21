// scripts/Track.js
// ES module — Track handles drawing the map/road, obstacles, and simple collision checks.
// Compatible with Camera (camera.x / camera.y used as world offset).

export default class Track {
  /**
   * @param {HTMLImageElement|null} roadSprite - optional background/road image
   * @param {object} opts - optional configuration
   *        opts.width, opts.height : world size
   *        opts.obstacles : array of {x,y,width,height}
   */
  constructor(roadSprite = null, opts = {}) {
    this.roadSprite = roadSprite;
    this.width = opts.width ?? 4000;   // world size
    this.height = opts.height ?? 4000;
    this.obstacles = opts.obstacles ?? [
      // default sample obstacles (you'll likely override from countries.json)
      { x: 800, y: 600, width: 140, height: 140 },
      { x: 1200, y: 1300, width: 200, height: 80 },
      { x: 200, y: 1800, width: 120, height: 120 }
    ];

    // optional track friction map (e.g., mud/grass slow zones) - array of rects with multiplier
    this.terrain = opts.terrain ?? [
      // { x:1000, y:1000, width:300, height:300, speedMultiplier: 0.6 }
    ];
  }

  // Check basic AABB collision between racer and obstacles/track boundaries
  checkCollision(racer) {
    // Boundary check: keep racer inside world
    const halfW = racer.width / 2;
    const halfH = racer.height / 2;
    if (racer.x - halfW < 0 || racer.x + halfW > this.width || racer.y - halfH < 0 || racer.y + halfH > this.height) {
      return { type: "boundary" };
    }

    // Obstacles
    for (const o of this.obstacles) {
      if (
        racer.x - halfW < o.x + o.width &&
        racer.x + halfW > o.x &&
        racer.y - halfH < o.y + o.height &&
        racer.y + halfH > o.y
      ) {
        return { type: "obstacle", obstacle: o };
      }
    }

    // Terrain slow zones
    for (const t of this.terrain) {
      if (
        racer.x - halfW < t.x + t.width &&
        racer.x + halfW > t.x &&
        racer.y - halfH < t.y + t.height &&
        racer.y + halfH > t.y
      ) {
        return { type: "terrain", terrain: t };
      }
    }

    return null;
  }

  // Optionally call in the game update loop to apply collisions/effects
  update(racer) {
    const col = this.checkCollision(racer);
    if (!col) return;

    if (col.type === "boundary") {
      // nudge racer back into world bounds
      racer.x = Math.min(Math.max(racer.x, racer.width / 2), this.width - racer.width / 2);
      racer.y = Math.min(Math.max(racer.y, racer.height / 2), this.height - racer.height / 2);
      // slight penalty
      racer.speed *= 0.6;
      racer.takeDamage?.(5);
    } else if (col.type === "obstacle") {
      // obstacle hit: heavy penalty and damage
      racer.speed *= 0.3;
      racer.takeDamage?.(12);
    } else if (col.type === "terrain") {
      // terrain: apply speed multiplier (slows player)
      racer.speed *= col.terrain.speedMultiplier ?? 0.7;
    }
  }

  // Draw the track: background image if available, otherwise simple filled road
  draw(ctx, camera) {
    // Draw background / road
    if (this.roadSprite && this.roadSprite.complete) {
      // Assuming roadSprite is large enough to cover world.
      // Draw at negative camera offset so world coords align.
      ctx.drawImage(this.roadSprite, -camera.x, -camera.y);
    } else {
      // fallback: draw plain grey ground that represents the world area
      ctx.save();
      ctx.fillStyle = "#2b2b2b";
      // draw world rectangle at camera offset
      ctx.fillRect(-camera.x, -camera.y, this.width, this.height);
      ctx.restore();
    }

    // draw obstacles
    ctx.save();
    ctx.fillStyle = "#7a3e3e";
    for (const o of this.obstacles) {
      ctx.fillRect(o.x - camera.x, o.y - camera.y, o.width, o.height);

      // debug outline
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.strokeRect(o.x - camera.x, o.y - camera.y, o.width, o.height);
    }
    ctx.restore();

    // draw terrain zones (slower areas)
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    for (const t of this.terrain) {
      ctx.fillRect(t.x - camera.x, t.y - camera.y, t.width, t.height);
    }
    ctx.restore();
  }
}
