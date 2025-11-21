// ===========================================
//        TOUCH CONTROLS (JOYSTICK + NITRO)
//      Works with lane-based Racer.js
// ===========================================

export default class TouchControls {

    constructor() {
        this.left = false;
        this.right = false;
        this.down = false;
        this.nitro = false;

        // Create UI only on mobile
        this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        if (this.isMobile) {
            this.createJoystick();
            this.createNitroButton();
        }
    }

    // ----------------------------------------------------
    //                JOYSTICK (LEFT / RIGHT)
    // ----------------------------------------------------
    createJoystick() {
        this.joy = document.createElement("div");
        this.joy.className = "touch-joystick";

        this.thumb = document.createElement("div");
        this.thumb.className = "touch-joystick-thumb";

        this.joy.appendChild(this.thumb);
        document.body.appendChild(this.joy);

        let startX = 0;

        this.joy.addEventListener("touchstart", e => {
            startX = e.touches[0].clientX;
        });

        this.joy.addEventListener("touchmove", e => {
            const x = e.touches[0].clientX;
            const diff = x - startX;

            // Move thumb visually
            this.thumb.style.transform = `translateX(${diff * 0.3}px)`;

            // Control lane movement
            if (diff > 30) {
                this.right = true;
                this.left = false;
            } else if (diff < -30) {
                this.left = true;
                this.right = false;
            } else {
                this.left = false;
                this.right = false;
            }
        });

        this.joy.addEventListener("touchend", () => {
            this.left = false;
            this.right = false;
            this.thumb.style.transform = "translateX(0px)";
        });
    }

    // ----------------------------------------------------
    //                    NITRO BUTTON
    // ----------------------------------------------------
    createNitroButton() {
        this.nitroBtn = document.createElement("div");
        this.nitroBtn.className = "nitro-button";

        const icon = document.createElement("img");
        icon.src = "assets/ui/nitro.png";
        this.nitroBtn.appendChild(icon);

        document.body.appendChild(this.nitroBtn);

        this.nitroBtn.addEventListener("touchstart", () => {
            this.nitro = true;
        });

        this.nitroBtn.addEventListener("touchend", () => {
            this.nitro = false;
        });
    }

    // ----------------------------------------------------
    //         DESKTOP KEYBOARD FALLBACK (OPTIONAL)
    // ----------------------------------------------------
    enableKeyboard() {
        window.addEventListener("keydown", e => {
            if (e.key === "ArrowLeft") this.left = true;
            if (e.key === "ArrowRight") this.right = true;
            if (e.key === "ArrowDown") this.down = true;
            if (e.key === "Shift") this.nitro = true;
        });

        window.addEventListener("keyup", e => {
            if (e.key === "ArrowLeft") this.left = false;
            if (e.key === "ArrowRight") this.right = false;
            if (e.key === "ArrowDown") this.down = false;
            if (e.key === "Shift") this.nitro = false;
        });
    }
}
