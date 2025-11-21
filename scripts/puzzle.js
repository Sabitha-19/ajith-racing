// =========================
//      PUZZLE / GAME LOGIC
// =========================

export default class Puzzle {
    constructor(racer, track, enemies, ui) {
        this.racer = racer;
        this.track = track;
        this.enemies = enemies;       // array of enemy cars
        this.ui = ui;                 // UI elements
        this.timer = 0;
        this.lap = 1;
        this.totalLaps = 3;

        this.countdown = 3;
        this.started = false;
        this.finished = false;

        this.lastTime = 0;

        this.startCountdown();
    }

    startCountdown() {
        this.ui.showCountdown("3");

        let tick = setInterval(() => {
            this.countdown--;

            if (this.countdown > 0) {
                this.ui.showCountdown(this.countdown.toString());
            } else if (this.countdown === 0) {
                this.ui.showCountdown("GO!");
                this.started = true;
                this.ui.hideCountdownDelayed();
            } else {
                clearInterval(tick);
            }
        }, 1000);
    }

    update(delta) {
        if (this.finished) return;

        if (this.started) {
            this.timer += delta;
            this.updateTimerUI();

            this.checkLapProgress();
            this.checkEnemyCollisions();
        }
    }

    updateTimerUI() {
        let seconds = Math.floor(this.timer);
        let ms = Math.floor((this.timer % 1) * 1000);
        this.ui.time.innerText = `${seconds}.${ms}`;
    }

    checkLapProgress() {
        if (this.racer.position > this.track.length - 20) {
            this.lap++;
            if (this.lap > this.totalLaps) {
                this.finishRace();
            } else {
                this.ui.updateLap(this.lap, this.totalLaps);
            }
        }
    }

    checkEnemyCollisions() {
        for (let enemy of this.enemies) {
            let dx = this.racer.x - enemy.x;
            let dz = this.racer.position - enemy.position;

            if (Math.abs(dx) < 0.4 && Math.abs(dz) < 1.5) {
                // send crash event to racer (handles flash + slowdown)
                this.racer.onCrash();
            }
        }
    }

    finishRace() {
        this.finished = true;
        this.started = false;
        this.ui.showWinScreen(this.timer);
    }

    resetRace() {
        this.timer = 0;
        this.lap = 1;
        this.started = false;
        this.finished = false;
        this.countdown = 3;

        this.racer.reset();
        this.track.reset();
        this.ui.updateLap(1, this.totalLaps);

        this.startCountdown();
    }

    spawnEnemy() {
        this.enemies.push(
            this.track.spawnEnemyCar(this.racer.position + 20)
        );
    }
}
