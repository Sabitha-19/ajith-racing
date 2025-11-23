// scripts/main.js
import Puzzle from "./puzzle.js";
import RacerGame from "./RacerGame.js";
import UIManager from "./UIManager.js";

// Global assets container (sprites)
window.__assets = {};

// Preload images used in racing
const preloadImages = (paths) => {
    const promises = [];
    paths.forEach(p => {
        const img = new Image();
        img.src = p.src;
        window.__assets[p.name] = img;
        promises.push(new Promise(res => img.onload = res));
    });
    return Promise.all(promises);
};

const racingAssets = [
    { src: "assets/car.png", name: "car" },
    { src: "assets/enemy.png", name: "enemy" },
    { src: "assets/road.png", name: "road" },
    { src: "assets/start.png", name: "start" },
    { src: "assets/finish.png", name: "finish" },
    { src: "assets/flame.png", name: "flame" },
    { src: "assets/health.png", name: "health" },
    { src: "assets/nitro.png", name: "nitro" }
];

// ---------------------------
// Step 1: Start Puzzle
// ---------------------------
const startPuzzle = async () => {
    // Create puzzle canvas and element
    const puzzleCanvas = document.createElement("canvas");
    document.body.appendChild(puzzleCanvas);

    const puzzle = new Puzzle(
        {
            canvas: puzzleCanvas,
            rows: 7,
            cols: 7,
            tileSize: 64,
            timeLimitSec: 45,
            progressTarget: 6,
        },
        () => {
            // Puzzle complete → move to country menu
            puzzle.destroy();
            showCountryMenu();
        }
    );
};

// ---------------------------
// Step 2: Show Country Menu
// ---------------------------
const showCountryMenu = () => {
    const countryUI = document.createElement("div");
    countryUI.id = "country-ui";
    countryUI.innerHTML = `<h2>Select Your Country</h2>`;
    document.body.appendChild(countryUI);

    fetch("data/countries.json")
        .then(res => res.json())
        .then(countries => {
            countries.slice(0, 6).forEach(c => {
                const btn = document.createElement("button");
                btn.innerText = c.name;
                btn.onclick = () => {
                    countryUI.remove();
                    startRace(c);
                };
                countryUI.appendChild(btn);
            });
        });
};

// ---------------------------
// Step 3: Start 2D Racing Game
// ---------------------------
const startRace = async (country) => {
    await preloadImages(racingAssets);

    // Create canvas for racing
    const gameContainer = document.getElementById("game-container") || document.createElement("div");
    gameContainer.id = "game-container";
    document.body.appendChild(gameContainer);
    gameContainer.innerHTML = ""; // clear anything inside

    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gameContainer.appendChild(canvas);

    // Initialize UIManager
    const uiManager = new UIManager({ container: gameContainer });

    // Initialize racing engine
    const game = new RacerGame({
        canvas,
        uiManager,
        country,
        assets: window.__assets
    });

    game.start();
};

// ---------------------------
// Step 4: Launch everything
// ---------------------------
window.onload = () => {
    startPuzzle();
};

