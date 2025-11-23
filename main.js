// main.js
import RacerGame from "./scripts/RacerGame.js";
import Track from "./scripts/Track.js";
import Racer from "./scripts/Racer.js";
import Enemy from "./scripts/Enemy.js";
import PowerUp from "./scripts/PowerUp.js";
import Camera from "./scripts/Camera.js";
import CollisionManager from "./scripts/CollisionManager.js";
import TouchControls from "./scripts/TouchControls.js";
import UIManager from "./scripts/UIManager.js";
import Puzzle from "./scripts/puzzle.js";

// ----------------------------
// Initialize Canvas and UI
// ----------------------------
const gameContainer = document.getElementById("game-container");

// Create main canvas
const canvas = document.createElement("canvas");
canvas.id = "game-canvas";
canvas.width = 960;
canvas.height = 540;
gameContainer.appendChild(canvas);

// Initialize UI Manager
const uiManager = new UIManager(gameContainer);

// ----------------------------
// Show Puzzle first
// ----------------------------
const puzzle = new Puzzle({
    canvas: canvas,
    rows: 7,
    cols: 7,
    tileSize: 64,
    timeLimitSec: 45,
    progressTarget: 6
}, () => {
    // When puzzle is complete, start the racing game
    startRacingGame();
});

// ----------------------------
// Racing Game Setup
// ----------------------------
let racingGame;

function startRacingGame() {
    // Clear canvas or reset for racing
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Initialize track
    const track = new Track(canvas.width, canvas.height);

    // Initialize player racer
    const player = new Racer({
        x: canvas.width / 2,
        y: canvas.height - 100,
        speed: 0,
        maxSpeed: 8
    });

    // Initialize enemies
    const enemies = [];
    for (let i = 0; i < 5; i++) {
        enemies.push(new Enemy({ x: Math.random() * canvas.width, y: -Math.random() * 600 }));
    }

    // Initialize power-ups
    const powerUps = [];
    for (let i = 0; i < 3; i++) {
        powerUps.push(new PowerUp({ x: Math.random() * canvas.width, y: -Math.random() * 600 }));
    }

    // Initialize camera
    const camera = new Camera(player, canvas);

    // Collision manager
    const collisionManager = new CollisionManager(player, enemies, powerUps);

    // Touch controls
    const touchControls = new TouchControls(player);

    // Initialize racing game engine
    racingGame = new RacerGame({
        canvas,
        player,
        track,
        enemies,
        powerUps,
        camera,
        collisionManager,
        uiManager
    });

    // Start game loop
    racingGame.start();
}

// ----------------------------
// UI Buttons Example (optional)
// ----------------------------
uiManager.createButton("Restart Puzzle", () => {
    puzzle.destroy();
    new Puzzle({
        canvas: canvas,
        rows: 7,
        cols: 7,
        tileSize: 64,
        timeLimitSec: 45,
        progressTarget: 6
    }, () => startRacingGame());
});
