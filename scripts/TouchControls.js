// scripts/TouchControls.js
// Handles player input (keyboard and mobile touch/joystick)

export default class TouchControls {
    constructor(canvas) {
        this.canvas = canvas;
        this.controls = {
            left: false,
            right: false,
            up: false, // Acceleration
            down: false,
            nitro: false
        };

        this._setupKeyboard();
        this._setupTouch();
    }

    _setupKeyboard() {
        const updateControl = (key, state) => {
            switch (key) {
                case "ArrowLeft":
                case "a":
                    this.controls.left = state;
                    break;
                case "ArrowRight":
                case "d":
                    this.controls.right = state;
                    break;
                case "ArrowUp": // Added acceleration control
                case "w":
                    this.controls.up = state;
                    break;
                case "ArrowDown":
                case "s":
                    this.controls.down = state;
                    break;
                case " ":
                    this.controls.nitro = state;
                    break;
            }
        };

        window.addEventListener("keydown", (e) => updateControl(e.key, true));
        window.addEventListener("keyup", (e) => updateControl(e.key, false));
    }

    _setupTouch() {
        if (!this.canvas) return;

        // Use canvas width/height to define control zones
        const canvasRect = this.canvas.getBoundingClientRect();
        
        const handleTouch = (e, state) => {
            e.preventDefault(); 
            this.controls.up = false;
            this.controls.left = false;
            this.controls.right = false;
            this.controls.nitro = false; 
            
            // Simplified touch: 
            // Tap left half = Left + Accelerate
            // Tap right half = Right + Accelerate
            // Tap top = Nitro (optional)

            for (let i = 0; i < e.touches.length; i++) {
                const touchX = e.touches[i].clientX - canvasRect.left;

                if (state) {
                    if (touchX < canvasRect.width / 2) {
                        this.controls.left = true;
                        this.controls.up = true;
                    } else {
                        this.controls.right = true;
                        this.controls.up = true;
                    }
                }
            }
            
            // Simple Nitro: if two fingers are down, activate nitro
            if (e.touches.length >= 2) {
                this.controls.nitro = true;
            }
        };

        this.canvas.addEventListener("touchstart", (e) => handleTouch(e, true));
        this.canvas.addEventListener("touchmove", (e) => handleTouch(e, true));
        this.canvas.addEventListener("touchend", (e) => {
            this.controls.up = false;
            this.controls.left = false;
            this.controls.right = false;
            this.controls.nitro = false;
        });
    }

    // return current control state
    getControls() {
        return { ...this.controls };
    }
}
