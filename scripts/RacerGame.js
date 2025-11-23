// scripts/RacerGame.js
// Main 2D racing engine (Canvas)
// Handles game loop, updates, collisions, drawing, and flow

import Racer from "./Racer.js";
import Track from "./Track.js";
import Enemy from "./Enemy.js";
import PowerUp from "./PowerUp.js";
import Camera from "./Camera.js";

export default class RacerGame {
    constructor(canvas, assets = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        // assets (sprites)
        this.assets = assets;
        if (typeof window !== "undefined") window.__assets = assets;

        // track & camera
        this.track = new Track({ lanes: 3, width: 600 });
        this.camera = new Camera();

        // player
        this.player = new Racer(assets.car);

        // enemies
        this.enemies = [];
        for (let i = 0; i < 5; i++) {
            const lane = Math.floor(Math.random() * 3) - 1;
            const pos = Math.random() * 1000 + 300;
            this.enemies.push(new Enemy(assets.enemy, lane, pos));
        }

        // power-ups
        this.powerUps = [];
        for (let i = 0; i < 10; i++) {
            const lane = Math.floor(Math.random() * 3) - 1;
            const pos = Math.random() * 2000 + 200;
            const types = ["coin", "nitro", "health"];
            const type = types[Math.floor(Math.random() * types.length)];
            const sprite = assets[type];
            this.powerUps.push(new PowerUp(type, lane, pos, sprite));
        }

        // controls
        this.controls = { left: false, right: false, down: false, nitro: false };

        // game state
        this.lastTime = 0;
        this.running = false;

        // crash flash overlay
        this.crashAlpha = 0;

        // bind loop
        this.loop = this.loop.bind(this);
    }

    // external control setters
    setControls(controls) {
        this.controls = controls;
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop);
    }

    stop() {
        this.running = false;
    }

    loop(timestamp) {
        const delta = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(delta);
        this.draw();

        if (this.running) requestAnimationFrame(this.loop);
    }

    update(delta) {
        // update player
        this.player.update(delta, this.controls);

        // update camera
        this.camera.target = this.player;
        this.camera.update();
        const camView = this.camera.getView();

        // update enemies
        this.enemies.forEach(enemy => {
            enemy.update(delta, this.track);

            // check collision with player
            const laneDiff = Math.abs(enemy.lane - this.player.lane);
            const posDiff = Math.abs(enemy.position - this.player.position);
            if (laneDiff < 0.6 && posDiff < 100) {
                this.player.crash();
                enemy.crash();
            }
        });

        // update power-ups
        this.powerUps.forEach(p => p.checkCollision(this.player));

        // remove collected power-ups
        this.powerUps = this.powerUps.filter(p => !p.collected);
    }

    draw() {
        const ctx = this.ctx;
        const camView = this.camera.getView();

        // clear
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // draw track (debug / road)
        this.track.draw(ctx, camView);

        // draw power-ups
        this.powerUps.forEach(p => p.draw(ctx, camView, this.track));

        // draw enemies
        this.enemies.forEach(e => e.draw(ctx, camView, this.track));

        // draw player
        this.player.draw(ctx, camView, this.track);

        // crash overlay
        if (this.player.crashFlash > 0) {
            ctx.fillStyle = `rgba(255,0,0,${this.player.crashFlash * 0.5})`;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // HUD (coins, health, nitro)
        ctx.fillStyle = "#fff";
        ctx.font = "20px Arial";
        ctx.fillText(`Coins: ${this.player.coins}`, 20, 30);
        ctx.fillText(`Health: ${Math.round(this.player.health)}`, 20, 60);
    }
}
