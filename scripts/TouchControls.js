// scripts/TouchControls.js
// ---------------------------------------------------
// Input Manager (Keyboard + Mobile Touch Joystick)
// ---------------------------------------------------

export default class TouchControls {
    constructor() {
        this.forward = false;
        this.left = false;
        this.right = false;
        this.nitro = false;

        this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        this.#setupKeyboard();
        if (this.isMobile) this.#createTouchControls();
    }

    // ---------------------------------------------------
    // Keyboard Input (Desktop)
    // ---------------------------------------------------
    #setupKeyboard() {
        window.addEventListener("keydown", e => {
            if (e.code === "ArrowUp" || e.code === "KeyW") this.forward = true;
            if (e.code === "ArrowLeft" || e.code === "KeyA") this.left = true;
            if (e.code === "ArrowRight" || e.code === "KeyD") this.right = true;
            if (e.code === "Space") this.nitro = true;
        });

        window.addEventListener("keyup", e => {
            if (e.code === "ArrowUp" || e.code === "KeyW") this.forward = false;
            if (e.code === "ArrowLeft" || e.code === "KeyA") this.left = false;
            if (e.code === "ArrowRight" || e.code === "KeyD") this.right = false;
            if (e.code === "Space") this.nitro = false;
        });
    }

    // ---------------------------------------------------
    // Touch Joystick (Mobile Only)
    // ---------------------------------------------------
    #createTouchControls() {
        // Joystick wrapper
        this.joystick = document.createElement("div");
        this.joystick.className = "touch-joystick";

        // inner thumb
        this.thumb = document.createElement("div");
        this.thumb.className = "touch-joystick-thumb";

        this.joystick.appendChild(this.thumb);
        document.body.appendChild(this.joystick);

        // Nitro Button
        this.nitroBtn = document.createElement("div");
        this.nitroBtn.className = "nitro-button";
        this.nitroBtn.innerHTML = "<img src='assets/nitro_icon.png'>";
        document.body.appendChild(this.nitroBtn);

        this.#setupJoystickLogic();
        this.#setupNitroButton();
    }

    // ---------------------------------------------------
    // Joystick Logic
    // ---------------------------------------------------
    #setupJoystickLogic() {
        let dragging = false;
        let startX = 0, startY = 0;

        const maxDist = 50;

        this.joystick.addEventListener("touchstart", e => {
            const t = e.touches[0];
            dragging = true;
            startX = t.clientX;
            startY = t.clientY;
        });

        window.addEventListener("touchmove", e => {
            if (!dragging) return;

            const t = e.touches[0];
            const dx = t.clientX - startX;
            const dy = t.clientY - startY;

            const dist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            // clamp inside circle
            const clampedDist = Math.min(maxDist, dist);
            const offsetX = Math.cos(angle) * clampedDist;
            const offsetY = Math.sin(angle) * clampedDist;

            this.thumb.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

            // directional input
            this.left = dx < -20;
            this.right = dx > 20;
            this.forward = dy < -10;
        });

        window.addEventListener("touchend", () => {
            dragging = false;
            this.thumb.style.transform = "translate(0px, 0px)";
            this.left = false;
            this.right = false;
            this.forward = false;
        });
    }

    // ---------------------------------------------------
    // Nitro Button Logic
    // ---------------------------------------------------
    #setupNitroButton() {
        this.nitroBtn.addEventListener("touchstart", () => {
            this.nitro = true;
        });

        this.nitroBtn.addEventListener("touchend", () => {
            this.nitro = false;
        });
    }
}
