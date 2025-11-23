// scripts/RacerGame.js
// Main 2D racing game engine
// Handles player, enemies, track, power-ups, camera, collisions

import Racer from "./Racer.js";
import Track from "./Track.js";
import Enemy from "./Enemy.js";
import PowerUp from "./PowerUp.js";
import Camera from "./Camera.js";
import CollisionManager from "./CollisionManager.js";

export default class RacerGame {
    constructor(options = {}) {
        // Canvas & context
        this.canvas = options.canvas || document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        if (!options.canvas) document.body.appendChild(this.canvas);

        this.width = this.canvas.width = options.width || 480;
        this.height = this.canvas.height = options.height || 720;

        // Assets (sprites/images)
        this.assets = options.assets || {};

        // Game entities
        this.player = new Racer(this.assets.car || null);
        this.track = new Track();
        this.enemies = [];
        this.powerUps = [];

        // Camera
        this.camera = new Camera(this.player, this.height);

        // Collision manager
        this.collisionManager = new CollisionManager(this);

        // Input state
        this.controls = { left: false, right: false, down: false, nitro: false };

        // Timing
        this.lastFrame = performance.now();

        // Game state
        this.running = false;
        this.score = 0;

        // Start the game loop
        this._spawnEnemies();
        this._spawnPowerUps();
        this.start();
    }

    start() {
        this.running = true;
        requestAnimationFrame(this._loop.bind(this));
    }

    stop() {
        this.running = false;
    }

    _loop() {
        if (!this.running) return;

        const now = performance.now();
        const delta = (now - this.lastFrame) / 1000;
        this.lastFrame = now;

        // Update
        this._update(delta);

        // Draw
        this._draw();

        requestAnimationFrame(this._loop.bind(this));
    }

    _update(delta) {
        // Update player
        this.player.update(delta, this.controls);

        // Update camera
        this.camera.update(delta);

        // Update enemies
        this.enemies.forEach(e => e.update(delta));

        // Update power-ups
        this.powerUps.forEach(p => p.update(delta));

        // Check collisions
        this.collisionManager.checkCollisions();
    }

    _draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw track
        this.track.draw(this.ctx, this.camera);

        // Draw power-ups
        this.powerUps.forEach(p => p.draw(this.ctx, this.camera));

        // Draw enemies
        this.enemies.forEach(e => e.draw(this.ctx, this.camera));

        // Draw player
        this.player.draw(this.ctx, this.camera, this.track);

        // Draw HUD (health, nitro, coins)
        this._drawHUD();
    }

    _drawHUD() {
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = "#fff";
        ctx.font = "16px Arial";
        ctx.fillText(`Health: ${Math.floor(this.player.health)}`, 10, 20);
        ctx.fillText(`Coins: ${this.player.coins}`, 10, 40);
        ctx.restore();
    }

    _spawnEnemies() {
        // Example: spawn 5 enemies at random positions
        for (let i = 0; i < 5; i++) {
            const lane = Math.floor(Math.random() * 3) - 1; // -1,0,1
            const pos = this.player.position + 300 + i * 200;
            this.enemies.push(new Enemy(lane, pos, this.assets.enemy || null));
        }
    }

    _spawnPowerUps() {
        // Example: spawn 5 power-ups at random positions
        const types = ["coin", "nitro", "health"];
        for (let i = 0; i < 5; i++) {
            const lane = Math.floor(Math.random() * 3) - 1;
            const pos = this.player.position + 250 + i * 150;
            const type = types[Math.floor(Math.random() * types.length)];
            this.powerUps.push(new PowerUp(lane, pos, type, this.assets[type] || null));
        }
    }

    // Input helpers
    setControls(controls) {
        this.controls = { ...this.controls, ...controls };
    }
}

