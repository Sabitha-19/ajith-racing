// ==========================
//      ENEMY RACER AI
// ==========================

export default class EnemyRacer {
    constructor(sprite, lane = 0, startPosition = 0) {

        // Position on track
        this.lane = lane;              // -1 = left, 0 = center, 1 = right
        this.position = startPosition; // forward distance on track

        // Screen rendering offsets
        this.x = 0;
        this.y = 0;

        // Movement
        this.speed = 20 + Math.random() * 4;
        this.maxSpeed = 28 + Math.random() * 6;

        this.targetLane = lane;
        this.laneSmooth = 0.12;

        // Sprite
        this.sprite = sprite;
        this.width = 70;
        this.height = 130;

        // AI wobble
        this.wobbleTime = Math.random() * 10;
    }

    setLane(laneIndex) {
        this.targetLane = laneIndex;
    }

    update(player, track, delta) {

        // -----------------------------
        //   AI Forward Speed Control
        // -----------------------------
        if (this.speed < this.maxSpeed) {
            this.speed += 0.05;
        }

        // Move forward
        this.position += this.speed * delta;

        // -----------------------------
        //       AI Lane Steering
        // -----------------------------
        // Slight wobble to make AI look alive
        this.wobbleTime += delta * 2;
        const wobble = Math.sin(this.wobbleTime) * 0.15;

        // AI tries to stay near player but not directly copy them
        const distanceToPlayer = player.position - this.position;

        // If AI is too far behind → increase speed slightly
        if (distanceToPlayer > 300) {
            this.maxSpeed += 0.05;
        }

        // Small chance to switch lanes for variety
        if (Math.random() < 0.002) {
            this.targetLane = [-1, 0, 1][Math.floor(Math.random() * 3)];
        }

        // Smoothly move lane toward target
        this.lane += (this.targetLane - this.lane) * this.laneSmooth;

        // Apply wobble
        this.lane += wobble * 0.05;

        // -----------------------------
        //   Convert track lane → X,Y
        // -----------------------------
        const screen = track.project(this.position, this.lane);

        this.x = screen.x;
        this.y = screen.y;
        this.scale = screen.scale;
    }

    draw(ctx) {
        if (!this.scale) return; // Not on screen yet

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);

        if (this.sprite.complete) {
            ctx.drawImage(
                this.sprite,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
        } else {
            // fallback placeholder
            ctx.fillStyle = "yellow";
            ctx.fillRect(-25, -50, 50, 100);
        }

        ctx.restore();
    }
}
