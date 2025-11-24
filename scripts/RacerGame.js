// scripts/RacerGame.js
import Racer from "./Racer.js";
import Track from "./Track.js";
import Enemy from "./Enemy.js";
import PowerUp from "./PowerUp.js";
import Camera from "./Camera.js";
import CollisionManager from "./CollisionManager.js";
import TouchControls from "./TouchControls.js"; // Import controls

export default class RacerGame {
    constructor(options = {}) {
        this.canvas = options.canvas;
        this.ctx = this.canvas.getContext("2d");
        
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.assets = options.assets || {};

        // Initialization
        this.player = new Racer({ x: this.width / 2, y: this.height * 0.8 });
        this.track = new Track();
        this.enemies = [];
        this.powerUps = [];

        this.camera = new Camera(this.player, this.canvas);
        this.collisionManager = new CollisionManager(this);
        this.controls = new TouchControls(this.canvas).getControls(); // Initial controls state

        this.lastFrame = performance.now();
        this.running = false;
        this.gameOver = false;
        
        // Spawn initial entities
        this._spawnEnemies(5);
        this._spawnPowerUps(3);
    }

    setControls(controls) {
        // This is where we receive the state from the TouchControls instance
        this.controls = controls.getControls();
    }

    start() {
        this.running = true;
        this.gameOver = false;
        this.player.health = 100;
        this.player.position = 0;
        requestAnimationFrame(this._loop.bind(this));
    }

    endGame(status) {
        this.running = false;
        this.gameOver = true;
        
        // Display result (e.g., call UIManager function if available)
        console.log(`Game Over! Status: ${status}`);
    }

    _loop() {
        if (!this.running) return;

        const now = performance.now();
        // Delta time in seconds
        const delta = (now - this.lastFrame) / 1000; 
        this.lastFrame = now;

        this._update(delta);
        this._draw();

        requestAnimationFrame(this._loop.bind(this));
    }

    _update(delta) {
        // Check for player health
        if (this.player.health <= 0) {
            this.endGame("Crashed");
            return;
        }
        
        // Check for finish line
        if (this.track.isFinished(this.player.position)) {
            this.endGame("Win");
            return;
        }

        // Update player
        this.player.update(delta, this.controls);

        // Update camera
        this.camera.update(delta);

        // Update enemies and manage despawn/respawn
        this.enemies.forEach(e => e.update(delta, this.player.position));
        
        // Update power-ups
        this.powerUps.forEach(p => p.update(delta, this.player.position));
        this.powerUps = this.powerUps.filter(p => !p.collected);
        
        // Spawn new power-ups if necessary
        if (this.powerUps.length < 3) {
             this._spawnPowerUps(1);
        }

        // Check collisions
        this.collisionManager.checkCollisions();
    }

    _draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw track using camera for scrolling reference
        this.track.draw(this.ctx, this.camera);

        // Draw power-ups (passing assets needed for sprite drawing)
        this.powerUps.forEach(p => p.draw(this.ctx, this.camera, this.assets));

        // Draw enemies
        this.enemies.forEach(e => e.draw(this.ctx, this.camera, this.assets));

        // Draw player (player is fixed on screen, only uses assets)
        this.player.draw(this.ctx, this.assets);

        this._drawHUD();
    }

    _drawHUD() {
        this.ctx.save();
        this.ctx.fillStyle = "#fff";
        this.ctx.font = "bold 18px Arial";
        
        // Health Bar
        this.ctx.fillText(`HEALTH: ${Math.floor(this.player.health)}%`, 10, 30);
        this.ctx.fillStyle = this.player.health > 50 ? "green" : (this.player.health > 20 ? "orange" : "red");
        this.ctx.fillRect(100, 15, this.player.health * 1.5, 20);

        // Coins
        this.ctx.fillStyle = "#fff";
        this.ctx.fillText(`COINS: ${this.player.coins}`, 10, 60);
        
        // Nitro Status
        if (this.player.nitro) {
            this.ctx.fillStyle = "cyan";
            this.ctx.fillText(`NITRO ACTIVE: ${this.player.nitroTime.toFixed(1)}s`, this.width - 200, 30);
        }
        
        // Position on Track
        this.ctx.fillStyle = "yellow";
        const progress = (this.player.position / this.track.length) * 100;
        this.ctx.fillText(`POS: ${progress.toFixed(1)}%`, this.width - 100, 60);

        this.ctx.restore();
    }

    _spawnEnemies(count) {
        for (let i = 0; i < count; i++) {
            const lane = Math.floor(Math.random() * 3) - 1; 
            const pos = this.player.position + 500 + i * 200; // Spawn ahead
            this.enemies.push(new Enemy(lane, pos, this.assets.enemy));
        }
    }

    _spawnPowerUps(count) {
        const types = ["coin", "nitro", "health"];
        for (let i = 0; i < count; i++) {
            const lane = Math.floor(Math.random() * 3) - 1;
            const pos = this.player.position + 400 + Math.random() * 400; // Spawn ahead
            const type = types[Math.floor(Math.random() * types.length)];
            this.powerUps.push(new PowerUp(type, lane, pos, this.assets[type]));
        }
    }
}
