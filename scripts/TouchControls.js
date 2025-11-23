// scripts/TouchControls.js
// Handles player input (keyboard + touch/joystick)
// Updates control object used by RacerGame

export default class TouchControls {
    constructor(game, options = {}) {
        this.game = game; // instance of RacerGame
        this.controls = { left: false, right: false, down: false, nitro: false };

        // optional joystick element
        this.joystick = options.joystickElement || null;

        // bind events
        this.bindKeyboard();
        this.bindTouch();
    }

    bindKeyboard() {
        window.addEventListener("keydown", e => {
            switch (e.code) {
                case "ArrowLeft":
                case "KeyA":
                    this.controls.left = true;
                    break;
                case "ArrowRight":
                case "KeyD":
                    this.controls.right = true;
                    break;
                case "ArrowDown":
                case "KeyS":
                    this.controls.down = true;
                    break;
                case "Space":
                    this.controls.nitro = true;
                    break;
            }
            this.game.setControls(this.controls);
        });

        window.addEventListener("keyup", e => {
            switch (e.code) {
                case "ArrowLeft":
                case "KeyA":
                    this.controls.left = false;
                    break;
                case "ArrowRight":
                case "KeyD":
                    this.controls.right = false;
                    break;
                case "ArrowDown":
                case "KeyS":
                    this.controls.down = false;
                    break;
                case "Space":
                    this.controls.nitro = false;
                    break;
            }
            this.game.setControls(this.controls);
        });
    }

    bindTouch() {
        if (!this.joystick) return;

        let touchStartX = 0;

        this.joystick.addEventListener("touchstart", e => {
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            e.preventDefault();
        });

        this.joystick.addEventListener("touchmove", e => {
            const touch = e.touches[0];
            const deltaX = touch.clientX - touchStartX;

            this.controls.left = deltaX < -20;
            this.controls.right = deltaX > 20;

            this.game.setControls(this.controls);
            e.preventDefault();
        });

        this.joystick.addEventListener("touchend", e => {
            this.controls.left = false;
            this.controls.right = false;
            this.controls.down = false;
            this.controls.nitro = false;
            this.game.setControls(this.controls);
            e.preventDefault();
        });
    }

    // optional: expose controls object
    getControls() {
        return this.controls;
    }
}
