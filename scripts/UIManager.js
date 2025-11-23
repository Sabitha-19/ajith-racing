// scripts/UIManager.js
// Manages UI flow: Puzzle → Country selection → Race
// Works with RacerGame.js

export default class UIManager {
    constructor(game, assets = {}) {
        this.game = game;       // instance of RacerGame
        this.assets = assets;   // image/sound assets

        // DOM containers
        this.container = document.getElementById("game-container");

        // UI state
        this.state = "puzzle"; // "puzzle" | "country" | "race"

        // Puzzle element
        this.puzzleEl = null;
        this.createPuzzle();

        // Country selection
        this.countryEl = null;

        // HUD
        this.hudEl = null;
        this.createHUD();
    }

    // -------------------------
    // Puzzle
    // -------------------------
    createPuzzle() {
        this.puzzleEl = document.createElement("div");
        this.puzzleEl.id = "puzzle-ui";
        this.puzzleEl.style.position = "absolute";
        this.puzzleEl.style.top = "50%";
        this.puzzleEl.style.left = "50%";
        this.puzzleEl.style.transform = "translate(-50%, -50%)";
        this.puzzleEl.style.color = "#fff";
        this.puzzleEl.style.fontSize = "24px";
        this.puzzleEl.style.textAlign = "center";
        this.puzzleEl.innerHTML = `
            <p>Solve the puzzle to unlock racing!</p>
            <button id="puzzle-solve">Solve Puzzle</button>
        `;
        this.container.appendChild(this.puzzleEl);

        document.getElementById("puzzle-solve").addEventListener("click", () => {
            this.showCountrySelection();
        });
    }

    // -------------------------
    // Country Selection
    // -------------------------
    showCountrySelection() {
        this.state = "country";
        this.puzzleEl.style.display = "none";

        this.countryEl = document.createElement("div");
        this.countryEl.id = "country-ui";
        this.countryEl.style.position = "absolute";
        this.countryEl.style.top = "50%";
        this.countryEl.style.left = "50%";
        this.countryEl.style.transform = "translate(-50%, -50%)";
        this.countryEl.style.color = "#fff";
        this.countryEl.style.fontSize = "24px";
        this.countryEl.style.textAlign = "center";
        this.countryEl.innerHTML = `<p>Select your country:</p>`;
        
        const countryList = this.assets.countries || ["India", "USA", "UK", "Japan"];
        countryList.forEach(name => {
            const btn = document.createElement("button");
            btn.textContent = name;
            btn.style.margin = "5px";
            btn.addEventListener("click", () => this.startRace(name));
            this.countryEl.appendChild(btn);
        });

        this.container.appendChild(this.countryEl);
    }

    // -------------------------
    // Start Race
    // -------------------------
    startRace(selectedCountry) {
        this.state = "race";
        if (this.countryEl) this.countryEl.style.display = "none";

        console.log("Starting race for country:", selectedCountry);
        this.game.start(); // starts the RacerGame loop
        this.hudEl.style.display = "block";
    }

    // -------------------------
    // HUD
    // -------------------------
    createHUD() {
        this.hudEl = document.createElement("div");
        this.hudEl.id = "race-hud";
        this.hudEl.style.position = "absolute";
        this.hudEl.style.top = "10px";
        this.hudEl.style.left = "10px";
        this.hudEl.style.color = "#fff";
        this.hudEl.style.fontSize = "20px";
        this.hudEl.style.display = "none";
        this.container.appendChild(this.hudEl);

        // update loop
        const updateHUD = () => {
            if (this.game && this.game.player && this.state === "race") {
                this.hudEl.innerHTML = `
                    Coins: ${this.game.player.coins} <br>
                    Health: ${Math.round(this.game.player.health)} <br>
                    Nitro: ${this.game.player.nitroTime.toFixed(1)}s
                `;
            }
            requestAnimationFrame(updateHUD);
        };
        updateHUD();
    }
}
