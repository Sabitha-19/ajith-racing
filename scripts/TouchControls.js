export default class TouchControls {
    constructor() {
        this.input = {
            x: 0,      // left/right   (-1 to +1)
            y: 0,      // forward      (0 to +1)
            nitro: false
        };

        this.joystick = null;
        this.joystickTouchId = null;

        this.nitroPressed = false;

        // Create UI buttons
        this.createUI();

        // Touch events
        this.addTouchEvents();

        // Keyboard fallback
        this.addKeyboardEvents();
    }

    // =========================================
    // CREATE UI (JOYSTICK + NITRO BUTTON)
    // =========================================
    createUI() {
        // Joystick base
        this.base = document.createElement("div");
        this.base.style.position = "fixed";
        this.base.style.left = "80px";
        this.base.style.bottom = "120px";
        this.base.style.width = "180px";
        this.base.style.height = "180px";
        this.base.style.background = "rgba(255,255,255,0.08)";
        this.base.style.borderRadius = "50%";
        this.base.style.backdropFilter = "blur(3px)";
        this.base.style.zIndex = "10";
        document.body.appendChild(this.base);

        // Joystick stick
        this.stick = document.createElement("div");
        this.stick.style.position = "absolute";
        this.stick.style.left = "60px";
        this.stick.style.top = "60px";
        this.stick.style.width = "60px";
        this.stick.style.height = "60px";
        this.stick.style.background = "rgba(255,255,255,0.4)";
        this.stick.style.borderRadius = "50%";
        this.stick.style.transition = "0.05s";
        this.base.appendChild(this.stick);

        // Nitro button
        this.nitroBtn = document.createElement("img");
        this.nitroBtn.src = "assets/nitro.png";
        this.nitroBtn.style.position = "fixed";
        this.nitroBtn.style.right = "50px";
        this.nitroBtn.style.bottom = "120px";
        this.nitroBtn.style.width = "140px";
        this.nitroBtn.style.opacity = "0.8";
        this.nitroBtn.style.zIndex = "10";
        this.nitroBtn.style.userSelect = "none";
        this.nitroBtn.style.touchAction = "none";
        document.body.appendChild(this.nitroBtn);

        this.nitroBtn.addEventListener("touchstart", () => this.nitroPressed = true);
        this.nitroBtn.addEventListener("touchend", () => this.nitroPressed = false);
        this.nitroBtn.addEventListener("mousedown", () => this.nitroPressed = true);
        this.nitroBtn.addEventListener("mouseup", () => this.nitroPressed = false);
    }

    // =========================================
    // TOUCH INPUT FOR JOYSTICK
    // =========================================
    addTouchEvents() {
        window.addEventListener("touchstart", (e) => this.onTouchStart(e));
        window.addEventListener("touchmove", (e) => this.onTouchMove(e));
        window.addEventListener("touchend", (e) => this.onTouchEnd(e));
    }

    onTouchStart(e) {
        for (let t of e.changedTouches) {
            const rect = this.base.getBoundingClientRect();
            if (
                t.clientX > rect.left &&
                t.clientX < rect.right &&
                t.clientY > rect.top &&
                t.clientY < rect.bottom
            ) {
                this.joystickTouchId = t.identifier;
            }
        }
    }

    onTouchMove(e) {
        if (this.joystickTouchId === null) return;

        for (let t of e.changedTouches) {
            if (t.identifier === this.joystickTouchId) {
                const rect = this.base.getBoundingClientRect();
                const dx = t.clientX - (rect.left + rect.width / 2);
                const dy = t.clientY - (rect.top + rect.height / 2);

                const maxDist = 70;
                const dist = Math.min(maxDist, Math.hypot(dx, dy));

                const angle = Math.atan2(dy, dx);

                const x = Math.cos(angle) * dist;
                const y = Math.sin(angle) * dist;

                // Move joystick stick
                this.stick.style.left = `${60 + x}px`;
                this.stick.style.top = `${60 + y}px`;

                // Normalized input (-1 to +1)
                this.input.x = x / maxDist;
                this.input.y = -y / maxDist;

                break;
            }
        }
    }

    onTouchEnd(e) {
        for (let t of e.changedTouches) {
            if (t.identifier === this.joystickTouchId) {
                // Reset joystick
                this.joystickTouchId = null;
                this.input.x = 0;
                this.input.y = 0;

                this.stick.style.left = "60px";
                this.stick.style.top = "60px";
            }
        }
    }

    // =========================================
    // KEYBOARD FALLBACK (PC)
    // =========================================
    addKeyboardEvents() {
        window.addEventListener("keydown", (e) => {
            if (e.key === "ArrowLeft" || e.key === "a") this.input.x = -1;
            if (e.key === "ArrowRight" || e.key === "d") this.input.x = 1;
            if (e.key === "ArrowUp" || e.key === "w") this.input.y = 1;
            if (e.key === "Shift") this.nitroPressed = true;
        });

        window.addEventListener("keyup", (e) => {
            if (e.key === "ArrowLeft" || e.key === "a") this.input.x = 0;
            if (e.key === "ArrowRight" || e.key === "d") this.input.x = 0;
            if (e.key === "ArrowUp" || e.key === "w") this.input.y = 0;
            if (e.key === "Shift") this.nitroPressed = false;
        });
    }

    // =========================================
    // RETURN FINAL INPUT STRUCT
    // =========================================
    getInput() {
        return {
            x: this.input.x,
            y: this.input.y,
