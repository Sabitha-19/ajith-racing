// scripts/main.js
import RacerGame from "./RacerGame.js";
import TouchControls from "./TouchControls.js";
import UIManager from "./UIManager.js";

// -------------------------
// Assets
// -------------------------
const assets = {};
const assetPaths = {
    car: "assets/car.png",
    enemy: "assets/enemy.png",
    flame: "assets/flame.png",
    coin: "assets/coin.png",
    nitro: "assets/nitro.png",
    health: "assets/health.png",
    countries: "data/countries.json" // JSON file with country list
};

// Load images
function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
    });
}

// Load JSON
function loadJSON(src) {
    return fetch(src).then(res => res.json());
}

// -------------------------
// Main init
// -------------------------
async function initGame() {
    // Load images
    assets.car = await loadImage(assetPaths.car);
    assets.enemy = await loadImage(assetPaths.enemy);
    assets.flame = await loadImage(assetPaths.flame);
    assets.coin = await loadImage(assetPaths.coin);
    assets.nitro = await loadImage(assetPaths.nitro);
    assets.health = await loadImage(assetPaths.health);

    // Load countries JSON
    try {
        assets.countries = await loadJSON(assetPaths.countries);
    } catch (err) {
        console.warn("Could not load countries JSON, using default");
        assets.countries = ["India", "USA", "UK", "Japan"];
    }

    // Canvas setup
    const canvas = document.getElementById("game-canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize game engine
    const game = new RacerGame(canvas, assets);

    // Initialize controls
    const controls = new TouchControls(game, {
        joystickElement: document.getElementById("joystick")
    });

    // Initialize UI manager
    const uiManager = new UIManager(game, assets);

    // Handle resize
    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// Start
initGame();
