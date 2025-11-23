// scripts/UIManager.js
// Handles UI overlays, menus, score display, and puzzle completion

export default class UIManager {
    constructor(gameContainer) {
        this.container = gameContainer || document.body;

        // Create main overlays
        this._createMainMenu();
        this._createCountryMenu();
        this._createHUD();
    }

    // -----------------------
    // Main Menu
    // -----------------------
    _createMainMenu() {
        this.mainMenu = document.createElement("div");
        this.mainMenu.id = "mainMenu";
        this.mainMenu.style.position = "absolute";
        this.mainMenu.style.left = "50%";
        this.mainMenu.style.top = "50%";
        this.mainMenu.style.transform = "translate(-50%, -50%)";
        this.mainMenu.style.background = "#222";
        this.mainMenu.style.padding = "30px";
        this.mainMenu.style.borderRadius = "12px";
        this.mainMenu.style.color = "white";
        this.mainMenu.style.textAlign = "center";
        this.mainMenu.style.zIndex = "1000";

        const title = document.createElement("h1");
        title.innerText = "Racing Game";
        this.mainMenu.appendChild(title);

        const playBtn = document.createElement("button");
        playBtn.innerText = "Play";
        playBtn.style.marginTop = "20px";
        playBtn.onclick = () => {
            this.hideMainMenu();
            if (this.onPlay) this.onPlay();
        };
        this.mainMenu.appendChild(playBtn);

        this.container.appendChild(this.mainMenu);
    }

    showMainMenu() {
        this.mainMenu.style.display = "block";
    }
    hideMainMenu() {
        this.mainMenu.style.display = "none";
    }

    // -----------------------
    // Country Selection Menu
    // -----------------------
    _createCountryMenu() {
        this.countryMenu = document.createElement("div");
        this.countryMenu.id = "countryMenu";
        this.countryMenu.style.position = "absolute";
        this.countryMenu.style.left = "50%";
        this.countryMenu.style.top = "50%";
        this.countryMenu.style.transform = "translate(-50%, -50%)";
        this.countryMenu.style.background = "#333";
        this.countryMenu.style.padding = "20px";
        this.countryMenu.style.borderRadius = "10px";
        this.countryMenu.style.color = "white";
        this.countryMenu.style.textAlign = "center";
        this.countryMenu.style.zIndex = "1000";
        this.countryMenu.style.display = "none";

        const title = document.createElement("h2");
        title.innerText = "Select Country";
        this.countryMenu.appendChild(title);

        const countries = ["USA", "France", "Japan", "India"];
        countries.forEach(name => {
            const btn = document.createElement("button");
            btn.innerText = name;
            btn.style.margin = "5px";
            btn.onclick = () => {
                this.hideCountryMenu();
                if (this.onSelectCountry) this.onSelectCountry(name);
            };
            this.countryMenu.appendChild(btn);
        });

        this.container.appendChild(this.countryMenu);
    }

    showCountryMenu() {
        this.countryMenu.style.display = "block";
    }
    hideCountryMenu() {
        this.countryMenu.style.display = "none";
    }

    // -----------------------
    // In-game HUD (score, timer)
    // -----------------------
    _createHUD() {
        this.hud = document.createElement("div");
        this.hud.id = "hud";
        this.hud.style.position = "absolute";
        this.hud.style.top = "10px";
        this.hud.style.left = "10px";
        this.hud.style.color = "white";
        this.hud.style.fontFamily = "Arial";
        this.hud.style.fontSize = "16px";
        this.hud.style.zIndex = "900";
        this.hud.innerText = "Score: 0";

        this.container.appendChild(this.hud);
    }

    updateScore(score) {
        this.hud.innerText = `Score: ${score}`;
    }

    // -----------------------
    // Callbacks
    // -----------------------
    onPlay(callback) {
        this.onPlay = callback;
    }

    onSelectCountry(callback) {
        this.onSelectCountry = callback;
    }
}
