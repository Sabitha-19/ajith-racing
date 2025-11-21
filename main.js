import Racer from "./scripts/Racer.js";
import Track from "./scripts/Track.js";
import Camera from "./scripts/Camera.js";
import TouchControls from "./scripts/TouchControls.js";
import Puzzle from "./scripts/puzzle.js";
import EnemyRacer from "./scripts/EnemyRacer.js";
import PowerUp from "./scripts/PowerUp.js";

const canvas = document.createElement("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.getElementById("game-container").appendChild(canvas);
const ctx = canvas.getContext("2d");

// GLOBAL OBJECTS
let racer, track, camera, controls;
let enemies = [];
let powerUps = [];

let gameStarted = false;
let countrySelected = false;

// =========================
// START GAME AFTER COUNTRY
// =========================
function startGame() {
    racer = new Racer();
    track = new Track();
    controls = new TouchControls();
    camera = new Camera(racer);

    controls.onNitroPressed = () => racer.activateNitro();

    enemies = [];
    powerUps = [];

    // Spawn 3 enemies
    for (let i = 0; i < 3; i++) {
        enemies.push(
            new EnemyRacer(
                new Image(),
                racer.x + Math.random() * 600 - 300,
                racer.y + 800 + i * 300
            )
        );
    }

    // Spawn some power-ups
    loadPowerUps();

    requestAnimationFrame(gameLoop);
}

// =============================
// LOAD POWER UPS ON THE TRACK
// =============================
function loadPowerUps() {
    const coinImg = new Image();
    coinImg.src = "./assets/coin.png";

    const nitroImg = new Image();
    nitroImg.src = "./assets/nitro.png";

    const healthImg = new Image();
    healthImg.src = "./assets/health.png";

    for (let i = 0; i < 5; i++) {
        powerUps.push(
            new PowerUp(
                coinImg,
                racer.x + Math.random() * 600 - 300,
                racer.y - i * 600 - 400,
                "coin"
            )
        );
        powerUps.push(
            new PowerUp(
                nitroImg,
                racer.x + Math.random() * 600 - 300,
                racer.y - i * 900 - 800,
                "nitro"
            )
        );
        powerUps.push(
            new PowerUp(
                healthImg,
                racer.x + Math.random() * 600 - 300,
                racer.y - i * 1200 - 1000,
                "health"
            )
        );
    }
}

// =========================
// SHOW COUNTRY MENU
// =========================
function showCountryMenu() {
    const menu = document.getElementById("countryMenu");
    menu.style.display = "block";

    const buttons = menu.querySelectorAll("button");

    buttons.forEach(btn => {
        btn.onclick = () => {
            menu.style.display = "none";
            startGame();
        };
    });
}

// =========================
// GAME LOOP
// =========================
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    racer.update(controls);
    camera.update();
    track.draw(ctx, camera);

    powerUps.forEach(p => {
        p.update();
        p.draw(ctx, camera);

        if (racer.checkPowerUpCollision(p)) {
            p.collected = true;
        }
    });

    powerUps = powerUps.filter(p => !p.collected);

    enemies.forEach(e => {
        e.update(racer);
        e.draw(ctx, camera);
    });

    racer.draw(ctx, camera);

    requestAnimationFrame(gameLoop);
}

// ===============================================
// GAME START FLOW: PUZZLE → COUNTRY → RACE
// ===============================================
new Puzzle(() => {
    document.getElementById("puzzle-screen").style.display = "none";

    // Show country menu
    const menu = document.getElementById("countryMenu");
    menu.style.display = "block";
});
