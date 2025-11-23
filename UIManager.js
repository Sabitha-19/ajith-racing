export default class UIManager {
    constructor() {
        // Screens
        this.puzzleScreen = document.getElementById("puzzle-screen");
        this.countryMenu = document.getElementById("countryMenu");
        this.gameContainer = document.getElementById("game-container");

        // Debug UI (optional)
        this.debugPanel = null;
    }

    // -------------------------------
    //   PUZZLE UI
    // -------------------------------
    showPuzzle() {
        this.puzzleScreen.style.display = "flex";
        this.countryMenu.style.display = "none";
        this.gameContainer.style.display = "none";
    }

    hidePuzzle() {
        this.puzzleScreen.style.display = "none";
    }

    // -------------------------------
    //   COUNTRY SELECT MENU
    // -------------------------------
    showCountryMenu() {
        this.countryMenu.style.display = "block";
        this.gameContainer.style.display = "none";
    }

    hideCountryMenu() {
        this.countryMenu.style.display = "none";
    }

    // -------------------------------
    //   GAME CANVAS
    // -------------------------------
    showGame() {
        this.gameContainer.style.display = "block";
    }

    hideGame() {
        this.gameContainer.style.display = "none";
    }

    // -------------------------------
    //   DEBUG UI (DEVELOPMENT ONLY)
    // -------------------------------
    createDebugUI(onSpawnEnemy, onResetRace) {
        if (this.debugPanel) return; // already created

        this.debugPanel = document.createElement("div");
        this.debugPanel.style.position = "absolute";
        this.debugPanel.style.top = "20px";
        this.debugPanel.style.right = "20px";
        this.debugPanel.style.padding = "12px";
        this.debugPanel.style.background = "rgba(0,0,0,0.5)";
        this.debugPanel.style.borderRadius = "10px";
        this.debugPanel.style.color = "white";
        this.debugPanel.style.zIndex = "9999";

        const title = document.createElement("div");
        title.innerText = "DEBUG PANEL";
        title.style.marginBottom = "10px";
        title.style.fontWeight = "bold";
        this.debugPanel.appendChild(title);

        const spawnBtn = document.createElement("button");
        spawnBtn.innerText = "Spawn Enemy";
        spawnBtn.style.marginRight = "6px";
        spawnBtn.onclick = onSpawnEnemy;
        this.debugPanel.appendChild(spawnBtn);

        const resetBtn = document.createElement("button");
        resetBtn.innerText = "Reset Race";
        resetBtn.onclick = onResetRace;
        this.debugPanel.appendChild(resetBtn);

        document.body.appendChild(this.debugPanel);
    }
}
