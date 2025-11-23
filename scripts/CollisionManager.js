// scripts/CollisionManager.js
// Handles collisions between player, enemies, and power-ups

export default class CollisionManager {
    constructor(game) {
        this.game = game; // reference to RacerGame instance
    }

    checkCollisions() {
        this._checkPlayerEnemyCollisions();
        this._checkPlayerPowerUpCollisions();
    }

    _checkPlayerEnemyCollisions() {
        const player = this.game.player;
        for (const enemy of this.game.enemies) {
            if (this._isColliding(player, enemy)) {
                // Handle collision: reduce health, bounce back
                player.health -= 10;
                // Simple bounce effect
                player.position -= 20;
                enemy.position += 10;
                // Optional: play crash sound
            }
        }
    }

    _checkPlayerPowerUpCollisions() {
        const player = this.game.player;
        for (let i = this.game.powerUps.length - 1; i >= 0; i--) {
            const power = this.game.powerUps[i];
            if (this._isColliding(player, power)) {
                this._applyPowerUp(player, power);
                // Remove collected power-up
                this.game.powerUps.splice(i, 1);
            }
        }
    }

    _applyPowerUp(player, powerUp) {
        switch (powerUp.type) {
            case "coin":
                player.coins = (player.coins || 0) + 1;
                break;
            case "health":
                player.health = Math.min(player.health + 20, 100);
                break;
            case "nitro":
                player.nitro = true;
                player.nitroTime = 2; // seconds of boost
                break;
        }
        // Optional: play sound effect
    }

    _isColliding(objA, objB) {
        // Simple rectangle collision based on lane and y position
        const laneWidth = 80; // adjust based on track lanes
        const playerX = objA.lane * laneWidth + this.game.width / 2;
        const playerY = objA.position || 0;
        const objX = objB.lane * laneWidth + this.game.width / 2;
        const objY = objB.position || 0;

        const dx = Math.abs(playerX - objX);
        const dy = Math.abs(playerY - objY);
        const collisionWidth = laneWidth * 0.6; // collision threshold
        const collisionHeight = 60; // adjust based on sprite

        return dx < collisionWidth && dy < collisionHeight;
    }
}
