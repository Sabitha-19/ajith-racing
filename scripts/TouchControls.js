// scripts/TouchControls.js
// Handles player input (keyboard and mobile touch/joystick)
// Exposes a simple interface: controls = { left, right, down, nitro }

export default class TouchControls {
    constructor(canvas) {
        this.canvas = canvas;
        this.controls = {
            left: false,
            right: false,
            down: false,
            nitro: false
        };

        this._setupKeyboard();
        this._setupTouch();
    }

    _setupKeyboard() {
        window.addEventListener("keydown", (e) => {
            switch (e.key) {
                case "ArrowLeft":
                case "a":
                    this.controls.left = true;
                    break;
                case "ArrowRight":
                case "d":
                    this.controls.right = true;
                    break;
                case "ArrowDown":
                case "s":
                    this.controls.down = true;
                    break;
                case " ":
                    this.controls.nitro = true;
                    break;
            }
        });

        window.addEventListener("keyup", (e) => {
            switch (e.key) {
                case "ArrowLeft":
                case "a":
                    this.controls.left = false;
                    break;
                case "ArrowRight":
                case "d":
                    this.controls.right = false;
                    break;
                case "ArrowDown":
                case "s":
                    this.controls.down = false;
                    break;
                case " ":
                    this.controls.nitro = false;
                    break;
            }
        });
    }

    _setupTouch() {
        if (!this.canvas) return;

        let startX = 0;
        let startY = 0;

        this.canvas.addEventListener("pointerdown", (e) => {
            startX = e.clientX;
            startY = e.clientY;
        });

        this.canvas.addEventListener("pointermove", (e) => {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            // horizontal swipe detection
            this.controls.left = dx < -20;
            this.controls.right = dx > 20;

            // down swipe
            this.controls.down = dy > 20;
        });

        this.canvas.addEventListener("pointerup", (e) => {
            this.controls.left = false;
            this.controls.right = false;
            this.controls.down = false;
            this.controls.nitro = false;
        });

        // optional tap for nitro
        this.canvas.addEventListener("click", (e) => {
            this.controls.nitro = true;
            setTimeout(() => { this.controls.nitro = false; }, 200);
        });
    }

    // return current control state
    getControls() {
        return { ...this.controls };
    }
}
