// scripts/UIManager.js
export default class UIManager {
    constructor(racer) {
        this.racer = racer; // Link to player for HUD info
        this.debugMode = true; // Toggle debug UI
        this.createDebugUI();
    }

    // ================================
    // HUD DRAWING
    // ================================
    drawHUD(ctx) {
        ctx.fillStyle = "white";
        ctx.font = "22px Arial";
        ctx.fillText("Speed: " + Math.round(this.racer.speed), 20, 40);

        // Coins
        ctx.fillText("Coins: " + this.racer.coins, 20, 70);

        // Health bar
        ctx.fillStyle = "red";
        ctx.fillRect(20, 100, 200, 20);

        ctx.fillStyle = "lime";
        ctx.fillRect(20, 100, (this.racer.health / 100) * 200, 20);

        ctx.strokeStyle = "white";
        ctx.strokeRect(20, 100, 200, 20);

        // Nitro bar
        ctx.fillStyle = "blue";
        ctx.fillRect(20, 130, (this.racer.nitroTime / this.racer.nitroMax) * 200, 10);
        ctx.strokeStyle = "white";
        ctx.strokeRect(20, 130, 200, 10);
    }

    // ================================
    // DEBUG UI (SPAWN, RESET)
    // ================================
    createDebugUI() {
        if (!this.debugMode) return;

        // Spawn Enemy button
        this.spawnBtn = document.createElement("button");
        this.spawnBtn.innerText = "Spawn Enemy";
        this.spawnBtn.style.position = "absolute";
        this.spawnBtn.style.top = "10px";
        this.spawnBtn.style.right = "10px";
        document.body.appendChild(this.spawnBtn);

        this.spawnBtn.onclick = () => {
            if (window.enemies) {
                const enemyImage = new Image();
                enemyImage.src = "assets/enemy.png";
                window.enemies.push(
                    new (window.EnemyRacer || window.Racer)(enemyImage, this.racer.x + 100, this.racer.y + 100)
                );
            }
        };

        // Reset Race button
        this.resetBtn = document.createElement("button");
        this.resetBtn.innerText = "Reset Race";
        this.resetBtn.style.position = "absolute";
        this.resetBtn.style.top = "50px";
        this.resetBtn.style.right = "10px";
        document.body.appendChild(this.resetBtn);

        this.resetBtn.onclick = () => {
            if (window.racer && window.track) {
                window.racer.x = window.track.startX || 0;
                window.racer.y = window.track.startY || 0;
                window.racer.speed = 0;
                window.racer.health = 100;
                window.enemies = [];
            }
        };
    }

    // ================================
    // PUZZLE SCREEN / COUNTRY MENU
    // ================================
    showPuzzleScreen() {
        const puzzleScreen = document.getElementById("puzzle-screen");
        puzzleScreen.style.display = "flex";
    }

    hidePuzzleScreen() {
        const puzzleScreen = document.getElementById("puzzle-screen");
        puzzleScreen.style.display = "none";
    }

    showCountryMenu() {
        const countryMenu = document.getElementById("countryMenu");
        countryMenu.style.display = "block";
    }

    hideCountryMenu() {
        const countryMenu = document.getElementById("countryMenu");
        countryMenu.style.display = "none";
    }
}
