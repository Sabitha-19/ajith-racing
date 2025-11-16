export default class TouchControls {
    constructor() {
        this.joystick = null;
        this.joystickThumb = null;
        this.nitroButton = null;

        this.value = { x: 0, y: 0 };
        this.isNitro = false;

        this.init();
    }

    init() {
        // ==========================
        // CREATE JOYSTICK
        // ==========================
        this.joystick = document.createElement("div");
        this.joystick.className = "touch-joystick";

        this.joystickThumb = document.createElement("div");
        this.joystickThumb.className = "touch-joystick-thumb";

        this.joystick.appendChild(this.joystickThumb);

        // ==========================
        // CREATE NITRO BUTTON
        // ==========================
        this.nitroButton = document.createElement("div");
        this.nitroButton.className = "nitro-button";

        const nitroImg = document.createElement("img");
        nitroImg.src = "./assets/nitro.png";
        this.nitroButton.appendChild(nitroImg);

        // Attach UI to screen
        document.body.appendChild(this.joystick);
        document.body.appendChild(this.nitroButton);

        // Touch events for joystick
        this.joystick.addEventListener("touchstart", this.onStart.bind(this));
        this.joystick.addEventListener("touchmove", this.onMove.bind(this));
        this.joystick.addEventListener("touchend", this.onEnd.bind(this));

        // Nitro button events
        this.nitroButton.addEventListener("touchstart", () => { this.isNitro = true; });
        this.nitroButton.addEventListener("touchend", () => { this.isNitro = false; });
    }

    onStart(e) {
        this.processMove(e.touches[0]);
    }

    onMove(e) {
        this.processMove(e.touches[0]);
    }

    onEnd() {
        this.value = { x: 0, y: 0 };
        this.joystickThumb.style.transform = `translate(0px, 0px)`;
    }

    processMove(touch) {
        const rect = this.joystick.getBoundingClientRect();

        let x = touch.clientX - (rect.left + rect.width / 2);
        let y = touch.clientY - (rect.top + rect.height / 2);

        const max = 40;
        const dist = Math.sqrt(x * x + y * y);

        if (dist > max) {
            x = (x / dist) * max;
            y = (y / dist) * max;
        }

        this.value = {
            x: x / max,   // steering
            y: -y / max   // throttle
        };

        this.joystickThumb.style.transform = `translate(${x}px, ${y}px)`;
    }

    getInput() {
        return {
            steer: this.value.x,
            throttle: this.value.y,
            nitro: this.isNitro
        };
    }
}
