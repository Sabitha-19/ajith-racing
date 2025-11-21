export default class TouchControls {
    constructor() {
        this.left = false;
        this.right = false;
        this.forward = false;

        this.joystick = null;
        this.thumb = null;

        this.nitroButton = document.querySelector(".nitro-button");

        this.initJoystick();
        this.initNitro();
    }

    initJoystick() {
        this.joystick = document.querySelector(".touch-joystick");
        this.thumb = document.querySelector(".touch-joystick-thumb");

        let dragging = false;

        this.joystick.addEventListener("touchstart", e => {
            dragging = true;
        });

        this.joystick.addEventListener("touchmove", e => {
            if (!dragging) return;

            let rect = this.joystick.getBoundingClientRect();
            let touch = e.touches[0];

            let x = touch.clientX - (rect.left + rect.width / 2);
            let y = touch.clientY - (rect.top + rect.height / 2);

            let maxDist = 40;
            let dist = Math.sqrt(x * x + y * y);

            if (dist > maxDist) {
                x = (x / dist) * maxDist;
                y = (y / dist) * maxDist;
            }

            this.thumb.style.transform = `translate(${x}px, ${y}px)`;

            this.left = x < -10;
            this.right = x > 10;
            this.forward = true;
        });

        this.joystick.addEventListener("touchend", () => {
            dragging = false;
            this.thumb.style.transform = "translate(0px, 0px)";
            this.left = this.right = this.forward = false;
        });
    }

    initNitro() {
        this.nitroButton.addEventListener("touchstart", () => {
            if (this.onNitroPressed) this.onNitroPressed();
        });
    }
}


