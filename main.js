// ===================================================
//                    MAIN GAME LOOP
// ===================================================

import Track from "./Track.js";
import Racer from "./Racer.js";
import EnemyRacer from "./EnemyRacer.js";
import PowerUp from "./PowerUp.js";
import Camera from "./Camera.js";
import TouchControls from "./TouchControls.js";
import Puzzle from "./puzzle.js";
import UIManager from "./UIManager.js";   // must exist

// ---------------------------------------------------
//                    GAME SETUP
// ---------------------------------------------------

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let lastTime = 0;

// SYSTEMS
const ui = new UIManager();
const track = new Track(canvas);
const camera = new Camera();
const player = new Racer();
const controls = new TouchControls(canvas, player);

// ENEMIES
let enemies = [];

// POWER UPS
let powerUps = [];

// PUZZLE (must be before race)
const puzzle = new Puzzle(ui);

// ---------------------------------------------------
//               COUNTRY MENU CALLBACK
// ---------------------------------------------------

ui.onCountrySelected = (countryName) => {
    console.log("Country chosen:", countryName);

    startRace(countryName);
};

// ---------------------------------------------------
//                  START RACE LOGIC
// ---------------------------------------------------

function startRace(country) {

    // load specific country data
    track.setEnvironment(country);

    // Create enemy racers
    enemies = [
        new EnemyRacer("red", 0.8),
        new EnemyRacer("blue", 0.6),
        new EnemyRacer("yellow", 0.7),
    ];

    // Load power-ups
    loadPowerUps();

    ui.hideEverything();
}

// ---------------------------------------------------
//                SPAWN POWER UPS
// ---------------------------------------------------

function loadPowerUps() {
    const coin = new Image();
    coin.src = "assets/coin.png";

    for (let i = 200; i < 3000; i += 400) {
        powerUps.push(new PowerUp(coin, Math.floor(Math.random() * 3) - 1, i, "coin"));
    }
}

// ---------------------------------------------------
//                 INPUT FOR PUZZLE
// ---------------------------------------------------

canvas.addEventListener("mousedown", (e) => {
    puzzle.onDown(e.clientX, e.clientY);
});
canvas.addEventListener("mousemove", (e) => {
    puzzle.onMove(e.clientX, e.clientY);
});
canvas.addEventListener("mouseup", (e) => {
    puzzle.onUp(e.clientX, e.clientY);
});

canvas.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    puzzle.onDown(t.clientX, t.clientY);
});
canvas.addEventListener("touchmove", (e) => {
    const t = e.touches[0];
    puzzle.onMove(t.clientX, t.clientY);
});
canvas.addEventListener("touchend", () => {
    puzzle.onUp(player.x, player.y);
});

// ---------------------------------------------------
//                      GAME LOOP
// ---------------------------------------------------

function loop(timestamp) {
    const delta = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ---------------------------
    //       1. PUZZLE FIRST
    // ---------------------------
    if (puzzle.active) {
        puzzle.draw(ctx);
        requestAnimationFrame(loop);
        return;
    }

    // ---------------------------
    //   2. COUNTRY MENU PHASE
    // ---------------------------
    if (ui.countryMenuVisible) {
        ui.drawCountryMenu(ctx);
        requestAnimationFrame(loop);
        return;
    }

    // ---------------------------
    //          3. RACING
    // ---------------------------

    track.update(camera, player);

    // Player
    player.update(delta, track);

    // Enemies
    enemies.forEach(enemy => {
        enemy.update(delta, track);
    });

    // PowerUps
    powerUps.forEach(p => {
        p.update(delta, track);

        if (p.checkCollision(player)) {
            ui.showPickupEffect(p.type);
        }
    });

    // DRAW ORDER
    track.drawRoad(ctx);

    enemies.forEach(enemy => enemy.draw(ctx));
    player.draw(ctx);
    powerUps.forEach(p => p.draw(ctx));

    track.drawEnvironment(ctx);

    ui.drawHUD(ctx);

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

