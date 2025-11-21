import Puzzle from "./scripts/Puzzle.js";
import PuzzleGame from "./scripts/PuzzleGame.js"; // your actual racing game manager

// UI elements
const puzzleScreen = document.getElementById("puzzle-screen");
const countryMenu = document.getElementById("country-menu");
const gameContainer = document.getElementById("game-container");
const countryButtons = document.querySelectorAll("#country-menu button");

// Canvas for racing game
const gameCanvas = document.getElementById("gameCanvas");

// -------------------------------------------------------
// 1. START PUZZLE
// -------------------------------------------------------
let puzzle;

function startPuzzle() {
    puzzle = new Puzzle("puzzleCanvas", () => {
        // Puzzle completed callback
        console.log("Puzzle solved! Showing country menu...");
        puzzleScreen.style.display = "none";
        showCountryMenu();
    });
}

startPuzzle();

// -------------------------------------------------------
// 2. COUNTRY MENU
// -------------------------------------------------------
function showCountryMenu() {
    countryMenu.style.display = "block";
}

countryButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const country = btn.dataset.country;

        console.log("Country selected →", country);

        countryMenu.style.display = "none";
        startRace(country);
    });
});

// -------------------------------------------------------
// 3. START RACING GAME
// -------------------------------------------------------
let racingGame;

function startRace(country) {
    console.log("Starting race in:", country);

    // Show game
    gameContainer.style.display = "block";

    // Run game manager
    racingGame = new PuzzleGame(gameCanvas);

    // Optional: country-based themes
    applyCountryTheme(country);
}

// -------------------------------------------------------
// 4. OPTIONAL: COUNTRY THEMES
// -------------------------------------------------------
function applyCountryTheme(country) {
    document.body.style.transition = "0.5s";

    const themes = {
        india: "#ff9933",
        japan: "#d90000",
        usa: "#1434A4",
        france: "#001f3f",
        italy: "#009246",
        germany: "#000000",
        brazil: "#009C3B",
        australia: "#002868",
        uae: "#00732F",
        china: "#CC0000",
        canada: "#D80427",
        uk: "#00247D",
        southafrica: "#007A4D"
    };

    document.body.style.background = themes[country] || "#000";
}
