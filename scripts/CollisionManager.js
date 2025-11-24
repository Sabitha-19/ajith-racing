// scripts/CollisionManager.js
// Handles collisions between player, enemies, and power-ups

export default class CollisionManager {
    constructor(game) {
        this.game = game; 
        this.laneWidth = 80;
        this.playerCollisionOffset = 30; // buffer around player position
    }

    checkCollisions() {
        this._checkPlayerEnemyCollisions();
        this._checkPlayerPowerUpCollisions();
    }

    _isColliding(objA, objB) {
        // Collision based on Lane Index (Horizontal) and Position (Vertical)
        
        // Check horizontal collision (lane index)
        const laneCollision = Math.abs(objA.lane - objB.lane) < 0.8; 

        // Check vertical collision (track position)
        const verticalDistance = Math.abs(objA.position - objB.position);
        const collisionHeight = objA.height / 2 + objB.height / 2; 

        // The objects collide if they are in the same/nearby lane and their positions overlap
        return laneCollision && verticalDistance < collisionHeight;
    }

    _checkPlayerEnemyCollisions() {
        const player = this.game.player;
        if (player.health <= 0) return;

        for (const enemy of this.game.enemies) {
            if (this._isColliding(player, enemy)) {
                
                // Handle collision: reduce health, bounce back
                player.health = Math.max(0, player.health - 15);
                
                // Simple bounce effect: push player back, push enemy forward
                player.position -= 30;
                player.speed = -player.maxSpeed * 0.5; // stop player and reverse slightly
                
                enemy.crash(); // Slow down enemy
                
                if (player.health === 0) {
                    this.game.endGame("Loss");
                }
            }
        }
    }

    _checkPlayerPowerUpCollisions() {
        const player = this.game.player;
        
        // Iterate backwards to safely remove collected power-ups
        for (let i = this.game.powerUps.length - 1; i >= 0; i--) {
            const power = this.game.powerUps[i];
            
            // Re-using the collision check, but power-ups are smaller so adjust height threshold
            const laneCollision = Math.abs(player.lane - power.lane) < 0.8;
            const verticalDistance = Math.abs(player.position - power.position);
            const collisionHeight = player.height / 2 + power.height / 2;
            
            if (laneCollision && verticalDistance < 80) { // tighter collision for pickups
                player.applyPowerUp(power.type);
                this.game.powerUps.splice(i, 1);
            }
        }
    }
}
