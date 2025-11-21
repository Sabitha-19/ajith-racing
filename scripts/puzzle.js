import Racer from "./Racer.js";
import EnemyRacer from "./EnemyRacer.js";
import Camera from "./Camera.js";
import TouchControls from "./TouchControls.js";
import Track from "./Track.js";
import PowerUp from "./PowerUp.js";

export default class PuzzleGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // TRACK
        this.track = new Track(this.width, this.height);

        // PLAYER CAR
        const playerSprite = new Image();
        playerSprite.src = "./assets/player.png";

        this.player = new Racer(playerSprite, this.width / 2, this.height / 2);

        // CAMERA
        this.camera = new Camera(this.player.x, this.player.y);

        // TOUCH CONTROLS
        this.controls = new TouchControls();

        // ENEMIES
        this.enemies = [];

        // POWER UPS
        this.powerUps = [];

        // Debug UI
        this.createDebugUI();

        // Load images for power-ups
        this.coinImg = new Image();
        this.coinImg.src = "./assets/powerups/coin.png";

        this.nitroImg = new Image();
        this.nitroImg.src = "./assets/powerups/nitro.png";

        this.healthImg = new Image();
        this.healthImg.src = "./assets/powerups/health.png";

        // Game Loop Start
        this.lastTime = 0;
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    // -------------------------------------------------------------
    // DEBUG UI
    // -------------------------------------------------------------
    createDebugUI() {
        const panel = document.createElement("div");
        panel.style.position = "absolute";
        panel.style.top = "10px";
        panel.style.left = "10px";
        panel.style.padding = "10px";
        panel.style.background = "rgba(0,0,0,0.5)";
        panel.style.color = "#fff";
        panel.style.borderRadius = "10px";
        panel.style.fontFamily = "Arial";
        panel.style.zIndex = "10";

        const spawnBtn = document.createElement("button");
        spawnBtn.innerText = "Spawn Enemy";
        spawnBtn.style.marginRight = "10px";
        spawnBtn.onclick = () => this.spawnEnemy();

        const resetBtn = document.createElement("button");
        resetBtn.innerText = "Reset Race";
        resetBtn.onclick = () => this.resetRace();

        panel.appendChild(spawnBtn);
        panel.appendChild(resetBtn);

        document.body.appendChild(panel);
    }

    // -------------------------------------------------------------
    // GAME ACTIONS
    // -------------------------------------------------------------
    spawnEnemy() {
        const sprite = new Image();
        sprite.src = "./assets/enemy.png";

        const ex = this.player.x + (Math.random() * 800 - 400);
        const ey = this.player.y - (Math.random() * 600 + 300);

        this.enemies.push(new EnemyRacer(sprite, ex, ey));
    }

    spawnPowerUp(type) {
        let img;

        if (type === "coin") img = this.coinImg;
        if (type === "nitro") img = this.nitroImg;
        if (type === "health") img = this.healthImg;

        const x = this.player.x + (Math.random() * 600 - 300);
        const y = this.player.y - (Math.random() * 800 + 200);

        this.powerUps.push(new PowerUp(img, x, y, type));
    }

    resetRace() {
        this.enemies = [];
        this.powerUps = [];
        this.player.x = this.width / 2;
        this.player.y = this.height / 2;
        this.player.speed = 0;
        this.camera.x = this.player.x;
        this.camera.y = this.player.y;
    }

    // -------------------------------------------------------------
    // GAME LOOP
    // -------------------------------------------------------------
    gameLoop(timeStamp) {
        const delta = (timeStamp - this.lastTime) / 1000;
        this.lastTime = timeStamp;

        this.update(delta);
        this.draw();

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(delta) {
        this.track.update(delta);

        this.player.update(this.controls, this.track);
        this.camera.follow(this.player);

        // Update enemies
        this.enemies.forEach(e => e.update(this.player));

        // Update powerups
        this.powerUps.forEach(p => p.update());

        // PowerUp collision check
        this.checkPowerUpCollection();
    }

    // -------------------------------------------------------------
    // COLLISION WITH POWER UPS
    // -------------------------------------------------------------
    checkPowerUpCollection() {
        this.powerUps = this.powerUps.filter(p => {
            const dx = p.x - this.player.x;
            const dy = p.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 70) {
                if (p.type === "coin") this.player.score += 1;
                if (p.type === "nitro") this.player.speed += 3;
                if (p.type === "health") this.player.health = Math.min(100, this.player.health + 20);

                return false; // remove collected powerup
            }
            return true;
        });
    }

    // -------------------------------------------------------------
    // DRAW EVERYTHING
    // -------------------------------------------------------------
    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Track
        this.track.draw(this.ctx);

        // Powerups
        this.powerUps.forEach(p => p.draw(this.ctx, this.camera));

        // Enemies
        this.enemies.forEach(e => e.draw(this.ctx, this.camera));

        // Player
        this.player.draw(this.ctx, this.camera);
    }
}
