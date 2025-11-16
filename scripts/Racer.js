constructor(carSprite) {
    this.x = 0;
    this.y = 0;
    this.angle = 0;

    this.speed = 0;
    this.acc = 0.25;
    this.maxSpeed = 8;
    this.nitroSpeed = 15;

    this.turnSpeed = 0.045;
    this.friction = 0.94;

    this.sprite = carSprite;

    this.width = 70;
    this.height = 130;

    // Smoke particle list
    this.smokeParticles = [];
}

update(input) {
    // Steering drift effect
    let turnAmount = input.steer * this.turnSpeed;

    // If car is fast --> drift increases
    if (this.speed > 5) {
        turnAmount *= 1.6; // extra drift slipping
    }

    this.angle += turnAmount;

    // Acceleration
    if (input.throttle > 0) {
        this.speed += this.acc;
    } else {
        this.speed *= this.friction;
    }

    // Nitro boost
    if (input.nitro) {
        this.speed = this.nitroSpeed;
    } else {
        this.speed = Math.min(this.speed, this.maxSpeed);
    }

    // Move car
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;

    // Create smoke on drift
    if (Math.abs(input.steer) > 0.2 && this.speed > 5) {
        this.createSmoke();
    }

    // Update smoke
    this.updateSmoke();
}

// Create drifting smoke particles
createSmoke() {
    this.smokeParticles.push({
        x: this.x - Math.cos(this.angle) * 20,
        y: this.y - Math.sin(this.angle) * 20,
        size: 10 + Math.random() * 10,
        alpha: 1
    });
}

updateSmoke() {
    this.smokeParticles.forEach(p => {
        p.size += 0.4;
        p.alpha -= 0.02;
    });

    // Remove faded smoke
    this.smokeParticles = this.smokeParticles.filter(p => p.alpha > 0);
}

draw(ctx, camera) {
    // Draw smoke first (behind car)
    this.drawSmoke(ctx, camera);

    ctx.save();
    ctx.translate(
        this.x - camera.x + window.innerWidth / 2,
        this.y - camera.y + window.innerHeight / 2
    );
    ctx.rotate(this.angle);

    if (this.sprite.complete) {
        ctx.drawImage(
            this.sprite,
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height
        );
    } else {
        ctx.fillStyle = "cyan";
        ctx.fillRect(-25, -50, 50, 100);
    }

    ctx.restore();
}
