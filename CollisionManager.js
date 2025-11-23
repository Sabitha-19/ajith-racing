// CollisionManager.js
// Handles all collision detection (player, enemies, obstacles, powerups)

export default class CollisionManager {
    constructor(racer, enemyRacers, powerUps, track, ui) {
        this.racer = racer;
        this.enemyRacers = enemyRacers;
        this.powerUps = powerUps;
        this.track = track;
        this.ui = ui;
    }

    update(deltaTime) {
        this.checkPlayerEnemyCollision();
        this.checkPlayerPowerups();
        this.checkTrackBoundaries();
    }

    checkPlayerEnemyCollision() {
        for (let enemy of this.enemyRacers) {
            if (!enemy.active) continue;

            if (this.intersects(this.racer, enemy)) {
                this.handleCrash(enemy);
            }
        }
    }

    checkPlayerPowerups() {
        for (let p of this.powerUps) {
            if (!p.active) continue;
            if (this.intersects(this.racer, p)) {
                p.collect();
                this.ui.flashMessage("POWER UP ACTIVATED!", "green");
            }
        }
    }

    checkTrackBoundaries() {
        if (!this.track) return;

        // Player goes outside road
        if (!this.track.isOnRoad(this.racer.x, this.racer.y)) {
            this.racer.speed *= 0.95; // slow penalty
            this.ui.showOffTrackWarning();
        } else {
            this.ui.hideOffTrackWarning();
        }
    }

    handleCrash(enemy) {
        this.racer.speed *= -0.3; // bounce back
        enemy.speed *= -0.2;
        this.ui.screenFlash();
        this.ui.flashMessage("CRASH!", "red");
    }

    intersects(a, b) {
        return !(
            a.x + a.width < b.x ||
            a.x > b.x + b.width ||
            a.y + a.height < b.y ||
            a.y > b.y + b.height
        );
    }
}
