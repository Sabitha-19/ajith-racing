// scripts/CollisionManager.js
// Simple 2D collision manager for lane-based racing
// Works with Racer, Enemy, PowerUp, Track

export default class CollisionManager {
    constructor(player, enemies = [], powerUps = []) {
        this.player = player;
        this.enemies = enemies;
        this.powerUps = powerUps;
    }

    update() {
        // -------------------------
        // Player vs Enemies
        // -------------------------
        this.enemies.forEach(enemy => {
            const laneDiff = Math.abs(enemy.lane - this.player.lane);
            const posDiff = Math.abs(enemy.position - this.player.position);

            // collision thresholds (adjustable)
            const laneThreshold = 0.6;
            const posThreshold = 100;

            if (laneDiff < laneThreshold && posDiff < posThreshold) {
                this.player.crash();
                enemy.crash();
            }
        });

        // -------------------------
        // Player vs PowerUps
        // -------------------------
        this.powerUps.forEach(p => {
            if (p.collected) return;

            const laneDiff = Math.abs(p.lane - this.player.lane);
            const posDiff = Math.abs(p.position - this.player.position);

            const laneThreshold = 0.5;
            const posThreshold = 80;

            if (laneDiff <= laneThreshold && posDiff <= posThreshold) {
                p.collected = true;
                this.player.applyPowerUp(p.type);
            }
        });

        // remove collected power-ups
        this.powerUps = this.powerUps.filter(p => !p.collected);
    }
}
