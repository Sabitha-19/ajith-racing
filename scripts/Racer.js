export default class Racer {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.speed = 0;
        this.maxSpeed = 1.0;
        this.nitroBoost = 2.0;

        this.turnSpeed = 0.04;
        this.angle = 0;

        this.isNitro = false;

        this.width = 2;
        this.height = 4;
    }

    update(input) {

        // Movement
        if (input.forward) this.speed += 0.02;
        else this.speed *= 0.95;

        if (this.isNitro) this.speed = this.maxSpeed * this.nitroBoost;
        else this.speed = Math.min(this.speed, this.maxSpeed);

        // Turning
        if (input.left) this.angle -= this.turnSpeed;
        if (input.right) this.angle += this.turnSpeed;

        // Apply movement
        this.x += Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;
    }

    activateNitro() {
        this.isNitro = true;
        setTimeout(() => this.isNitro = false, 1500);
    }
}
