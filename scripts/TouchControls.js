// TouchControls.js
export default class TouchControls {
    constructor(player) {
        this.player = player;

        this.leftPressed = false;
        this.rightPressed = false;
        this.acceleratePressed = false;
        this.brakePressed = false;

        this.createButtons();
        this.addEvents();
    }

    createButtons() {
        this.container = document.createElement("div");
        this.container.id = "touch-controls";
        this.container.style.position = "absolute";
        this.container.style.bottom = "20px";
        this.container.style.left = "0";
        this.container.style.width = "100%";
        this.container.style.display = "flex";
        this.container.style.justifyContent = "space-between";
        this.container.style.padding = "0 20px";
        this.container.style.zIndex = "10";
        document.body.appendChild(this.container);

        // Left button
        this.leftBtn = this.makeButton("⟵");
        this.container.appendChild(this.leftBtn);

        // Right button
        this.rightBtn = this.makeButton("⟶");
        this.container.appendChild(this.rightBtn);

        // Accelerate button
        this.accelerateBtn = this.makeButton("▲");
        this.accelerateBtn.style.position = "absolute";
        this.accelerateBtn.style.right = "30px";
        this.accelerateBtn.style.bottom = "90px";
        document.body.appendChild(this.accelerateBtn);

        // Brake button
        this.brakeBtn = this.makeButton("▼");
        this.brakeBtn.style.position = "absolute";
        this.brakeBtn.style.right = "30px";
        this.brakeBtn.style.bottom = "20px";
        document.body.appendChild(this.brakeBtn);
    }

    makeButton(label) {
        const btn = document.createElement("div");
        btn.innerText = label;
        btn.style.width = "70px";
        btn.style.height = "70px";
        btn.style.background = "rgba(255,255,255,0.25)";
        btn.style.border = "2px solid #fff";
        btn.style.borderRadius = "50%";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";
        btn.style.fontSize = "35px";
        btn.style.color = "#fff";
        btn.style.fontWeight = "bold";
        btn.style.userSelect = "none";
        btn.style.touchAction = "none";
        return btn;
    }

    addEvents() {
        this.bindPress(this.leftBtn, "leftPressed");
        this.bindPress(this.rightBtn, "rightPressed");
        this.bindPress(this.accelerateBtn, "acceleratePressed");
        this.bindPress(this.brakeBtn, "brakePressed");
    }

    bindPress(btn, stateName) {
        btn.addEventListener("touchstart", (e) => {
            e.preventDefault();
            this[stateName] = true;
        });

        btn.addEventListener("touchend", (e) => {
            e.preventDefault();
            this[stateName] = false;
        });
    }

    update() {
        if (this.leftPressed) this.player.turnLeft();
        if (this.rightPressed) this.player.turnRight();
        if (this.acceleratePressed) this.player.accelerate();
        if (this.brakePressed) this.player.brake();
    }
}

