// ============================
// MAIN.JS — GAME CONTROLLER
// ============================

import { Puzzle } from "./scripts/puzzle.js";
import { UIManager } from "./scripts/UIManager.js";
import { RacerGame } from "./scripts/RacerGame.js";

// Global handles
let puzzle = null;
let ui = null;
let game = null;

/*  
    FLOW:
    1. Page loads → Show puzzle
    2. Player completes puzzle → Animation → Show country menu
    3. Select country → Start racing game
*/

window.onload = () => {
    ui = new UIManager();
    startPuzzle();
};

// ============================
// STEP 1 — START PUZZLE
// ============================
function startPuzzle() {
    ui.showPuzzle();
    puzzle = new Puzzle({
        onComplete: handlePuzzleComplete
    });
}

// ============================
// STEP 2 — PUZZLE COMPLETED
// ============================
function handlePuzzleComplete() {
    ui.showPuzzleCompleteAnimation(() => {
        ui.hidePuzzle();
        ui.showCountryMenu();
    });
}

// ============================
// STEP 3 — SELECT COUNTRY → START GAME
// ============================
document.addEventListener("click", (event) => {
    if (event.target.classList.contains("country-item")) {
        const country = event.target.dataset.country;
        beginRacing(country);
    }
});

// ============================
// RACING GAME START
// ============================
function beginRacing(country) {
    ui.hideCountryMenu();

    // Load racing game
    if (!game) {
        game = new RacerGame("game-canvas");
    }

    game.loadTrack(country);
    game.start();
}

// ============================
// Debug (optional)
// ============================
// window.restartPuzzle = startPuzzle;
