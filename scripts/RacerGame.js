// scripts/RacerGame.js

import Camera from './Camera.js';
import Track from './Track.js';
import Car from './Car.js'; // Assuming Car.js holds the player logic
import Enemy from './Enemy.js';
import PowerUp from './PowerUp.js';
import CollisionManager from './CollisionManager.js';
import TouchControls from './TouchControls.js'; // Already imported via index.html, but useful here if standalone

export default class RacerGame {
    /**
     * @param {object} options - Configuration object containing canvas and assets.
     */
    constructor(options) {
        this.canvas = options.canvas;
        this.ctx = this.canvas.getContext('2d');
        this.assets = options.assets;
        this.country = options.country || "USA";

        // Game State
        this.running = false;
        this.gameOver = false;
        this.score = 0;
        this.timeElapsed = 0;
        this.animationFrameId = null;
        this.lastTime = performance.now();
        
        // Game World Setup
        this.worldWidth = this.canvas.width * 2; // Example: World is wider than the screen
        this.worldHeight = 10000; // Long track

        // Initialize Core Components
        this.track = new Track(this.worldWidth, this.worldHeight, this.assets);
        this.player = new Car(
            this.assets.car, 
            this.worldWidth / 2, 
            this.worldHeight - 100, // Start near the bottom
            this.track.roadWidth // Pass max road width for boundary checks
        );
        
        this.camera = new Camera(this.canvas.width, this.canvas.height);
        this.camera.setTarget(this.player, this.worldWidth, this.worldHeight);

        // Entities
        this.enemies = this._initializeEnemies(20);
        this.powerUps = this._initializePowerUps(10);
        
        // Collision Manager
        this.collisionManager = new CollisionManager();

        // Callbacks
        this.onTimeUpdate = options.onTimeUpdate || (() => {});
        this.controls = null;
        
        console.log("RacerGame initialized.");
    }

    /**
     * Creates and places enemies along the track.
     * @param {number} count - Number of enemies to create.
     * @returns {Array<Enemy>}
     */
    _initializeEnemies(count) {
        const enemies = [];
        for (let i = 0; i < count; i++) {
            const x = this.track.roadWidth / 2 + (Math.random() - 0.5) * (this.track.roadWidth - 50);
            const y = 200 + i * (this.worldHeight / count) * 0.8; // Space them out
            enemies.push(new Enemy(this.assets.enemy, x, y));
        }
        return enemies;
    }

    /**
     * Creates and places power-ups along the track.
     * @param {number} count - Number of power-ups to create.
     * @returns {Array<PowerUp>}
     */
    _initializePowerUps(count) {
        const powerUps = [];
        const types = ['nitro', 'coin', 'health'];
        for (let i = 0; i < count; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            const asset = this.assets[type];
            const x = this.track.roadWidth / 2 + (Math.random() - 0.5) * (this.track.roadWidth - 50);
            const y = 500 + i * (this.worldHeight / count) * 0.9;
            powerUps.push(new PowerUp(asset, x, y, type));
        }
        return powerUps;
    }
    
    /**
     * Sets the control input source (e.g., TouchControls instance).
     * @param {TouchControls} controls - The controls instance.
     */
    setControls(controls) {
        this.controls = controls;
    }

    /**
     * The main game loop update function.
     * @param {number} dt - Delta time in seconds.
     */
    update(dt) {
        if (this.gameOver || !this.running) return;
        
        // 1. Update Game State
        this.timeElapsed += dt;
        this.onTimeUpdate(this.timeElapsed);

        // 2. Process Player Input
        const input = this.controls ? this.controls.getInput() : { left: false, right: false, up: false, down: false };
        this.player.handleInput(input);
        
        // 3. Update Entities
        this.player.update(dt);
        this.enemies.forEach(e => e.update(dt, this.player)); // Enemies might target player
        
        // Remove entities that have passed the camera view or are collected
        this.enemies = this.enemies.filter(e => e.y > this.camera.y - e.height);
        this.powerUps = this.powerUps.filter(p => !p.collected);

        // 4. Update Camera
        this.camera.update();

        // 5. Check Collisions
        this.collisionManager.checkCarCollisions(this.player, this.enemies, (car, enemy) => {
            // Player vs Enemy collision handler
            car.takeDamage(10); 
            enemy.resetPosition(this.worldHeight); // Move enemy back to the top
            if (car.health <= 0) {
                this.endGame(false);
            }
        });

        this.collisionManager.checkPowerUpCollisions(this.player, this.powerUps, (car, powerUp) => {
            // Player vs PowerUp collision handler
            car.applyPowerUp(powerUp); 
            powerUp.collected = true;
        });

        // 6. Check Win/Loss Condition
        if (this.player.y < 50) { // If player reaches the top/finish line
            this.endGame(true);
        }
    }

    /**
     * The main rendering function.
     */
    draw() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // --- Draw World Elements (Transformed) ---
        this.ctx.save();
        this.camera.applyTransform(this.ctx);

        // 1. Draw Track
        this.track.draw(this.ctx, this.camera);
        
        // 2. Draw Entities
        this.enemies.forEach(e => e.draw(this.ctx));
        this.powerUps.forEach(p => p.draw(this.ctx));
        this.player.draw(this.ctx);

        this.ctx.restore(); // Restore context state to reset translation

        // --- Draw UI Elements (Not Transformed) ---
        this._drawHUD();
        
        if (!this.running && !this.gameOver) {
            this._drawPauseOverlay();
        }
        if (this.gameOver) {
            this._drawGameOverOverlay();
        }
    }

    /**
     * Draws the heads-up display (HUD) for player stats.
     */
    _drawHUD() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(10, 10, 200, 100); 

        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Health: ${Math.round(this.player.health)}%`, 20, 30);
        this.ctx.fillText(`Speed: ${Math.round(this.player.velocity * 10)} km/h`, 20, 50);
        this.ctx.fillText(`Coins: ${this.player.coins}`, 20, 70);
        
        // Draw Nitro bar
        this.ctx.fillStyle = 'blue';
        this.ctx.fillRect(20, 85, this.player.nitroLevel * 1.5, 10);
        this.ctx.strokeStyle = 'white';
        this.ctx.strokeRect(20, 85, 150, 10);
    }
    
    _drawPauseOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    }

    _drawGameOverOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'red';
        this.ctx.font = '64px Arial';
        this.ctx.textAlign = 'center';
        
        const message = this.player.health <= 0 ? 'GAME OVER!' : 'RACE COMPLETE!';
        this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2 - 30);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Final Time: ${Math.floor(this.timeElapsed)}s`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        this.ctx.fillText(`Coins Collected: ${this.player.coins}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
    
    /**
     * Starts the animation loop.
     */
    start() {
        if (this.running || this.gameOver) return;
        this.running = true;
        this.loop();
    }
    
    /**
     * Stops the animation loop.
     */
    stop() {
        this.running = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    /**
     * Ends the game and shows the result.
     * @param {boolean} won - True if the player won, false otherwise.
     */
    endGame(won) {
        this.gameOver = true;
        this.running = false;
        console.log(`Game Over. Won: ${won}`);
        // Optionally, trigger a UIManager method here to show an HTML final score screen
    }

    /**
     * Main animation loop using requestAnimationFrame.
     */
    loop = (currentTime) => {
        if (!this.running && !this.gameOver) return;

        const dt = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;

        this.update(dt);
        this.draw();

        if (this.running) {
            this.animationFrameId = requestAnimationFrame(this.loop);
        }
    }
}
