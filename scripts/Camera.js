export default class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;

        this.followSpeed = 0.08; // smoothness (lower = smoother)
    }

    update(target) {
        // Smooth camera follow
        this.x += (target.x - this.x) * this.followSpeed;
        this.y += (target.y - this.y) * this.followSpeed;
    }
}
