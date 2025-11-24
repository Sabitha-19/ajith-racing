// scripts/Car.js

export default class Car {
    /**
     * @param {HTMLImageElement} img - The car's image asset.
     * @param {number} startX - Initial X position.
     * @param {number} startY - Initial Y position.
     * @param {number} maxRoadWidth - The maximum width the car can travel (used for boundaries).
     */
    constructor(img, startX, startY, maxRoadWidth) {
        this.img = img;
        this.width = 40; // Car dimensions
        this.height = 70;

        // Position
        this.x = startX - this.width / 2;
        this.y = startY;

        // Physics/Movement
        this.velocity = 0;
        this.maxSpeed = 300; // Base speed (pixels per second)
        this.acceleration = 1000;
        this.friction = 0.98; // Slow down over time
        this.steerRate = 300; // Lateral movement rate

        // Game State
        this.health = 100;
        this.coins = 0;
        this.nitroLevel = 150; // Max nitro amount (used for HUD and consumption)
        this.nitroRate = 300; // Speed boost multiplier
        this.isNitrous = false;
        this.maxRoadWidth = maxRoadWidth;
        
        // Visuals
        this.damageFlash = 0; // Timer for visual damage feedback
        this.isDestroyed = false;
    }

    /**
     * Updates car position and state based on input and physics.
     * @param {number} dt - Delta time in seconds.
     */
    update(dt) {
        if (this.isDestroyed) return;

        // 1. Apply Friction to Velocity
        this.velocity *= this.friction;

        // 2. Apply Acceleration/Deceleration from Input
        let currentMaxSpeed = this.maxSpeed * (this.isNitrous ? 1.5 : 1);
        
        if (this.input?.up) {
            this.velocity += this.acceleration * dt;
        } else if (this.input?.down) {
            this.velocity -= this.acceleration * dt * 0.5; // Reverse slower
        }

        // 3. Clamp Velocity
        this.velocity = Math.min(this.velocity, currentMaxSpeed);
        this.velocity = Math.max(this.velocity, -currentMaxSpeed / 4);

        // 4. Update Y Position (Moving up the track)
        this.y -= this.velocity * dt;

        // 5. Update X Position (Steering)
        if (this.input?.left) {
            this.x -= this.steerRate * dt;
        }
        if (this.input?.right) {
            this.x += this.steerRate * dt;
        }

        // 6. Handle Nitrous Boost
        if (this.input?.nitro && this.nitroLevel > 0) {
            this.isNitrous = true;
            this.nitroLevel -= 20 * dt; // Consume nitro
        } else {
            this.isNitrous = false;
        }
        this.nitroLevel = Math.max(0, this.nitroLevel); // Ensure it doesn't go below zero

        // 7. Clamp to Road Boundaries
        const minX = (this.maxRoadWidth - this.width) / 2;
        const maxX = this.maxRoadWidth - this.width - minX; 
        
        this.x = Math.max(this.x, minX);
        this.x = Math.min(this.x, this.maxRoadWidth - this.width);
        
        // 8. Decay damage flash
        this.damageFlash = Math.max(0, this.damageFlash - dt * 2);
    }

    /**
     * Stores the current input state from the controls module.
     * @param {object} input - Object containing boolean flags (up, down, left, right, nitro).
     */
    handleInput(input) {
        this.input = input;
    }

    /**
     * Renders the car on the canvas.
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
     */
    draw(ctx) {
        if (this.isDestroyed) return;

        // Apply temporary visual flash when damaged
        if (this.damageFlash > 0 && Math.floor(this.damageFlash * 10) % 2 === 0) {
            ctx.filter = 'brightness(300%) invert(100%)'; // Visual flicker
        } else {
            ctx.filter = 'none';
        }

        // Draw the main car image
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        
        // Draw the nitro flame effect behind the car if boosting (optional: assumes an asset named 'flame' exists)
        if (this.isNitrous && this.img.src.includes('car.png')) { 
             ctx.fillStyle = 'orange';
             ctx.fillRect(this.x + this.width / 4, this.y + this.height - 5, this.width / 2, 20);
        }

        ctx.filter = 'none'; // Always reset filter after drawing the car
    }

    /**
     * Handles taking damage and health loss.
     * @param {number} amount - Amount of damage taken.
     */
    takeDamage(amount) {
        this.health -= amount;
        this.damageFlash = 0.3; // Set flash duration
        this.health = Math.max(0, this.health);
        if (this.health <= 0) {
            this.isDestroyed = true;
            this.velocity = 0;
        }
    }

    /**
     * Applies effects from a collected power-up.
     * @param {PowerUp} powerUp - The power-up object.
     */
    applyPowerUp(powerUp) {
        switch (powerUp.type) {
            case 'coin':
                this.coins += 1;
                break;
            case 'health':
                this.health = Math.min(100, this.health + 20);
                break;
            case 'nitro':
                this.nitroLevel = Math.min(150, this.nitroLevel + 50);
                break;
        }
    }
}
