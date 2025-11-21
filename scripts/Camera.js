export default class Camera {
    constructor(target) {
        this.target = target;
        this.x = 0;
        this.y = 0;
    }

    update() {
        this.x = this.target.x;
        this.y = this.target.y - 10;
    }
}

