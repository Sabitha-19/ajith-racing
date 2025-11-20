import TouchControls from "./scripts/TouchControls.js";
import Racer from "./scripts/Racer.js";
import Track from "./scripts/Track.js";
import Camera from "./scripts/Camera.js";
import EnemyRacer from "./scripts/EnemyRacer.js";
import Puzzle from "./scripts/puzzle.js";  // <-- NEW PUZZLE SYSTEM

let gameStarted = false; // Game waits until puzzle is solved

// ================================
// CANVAS SETUP
// ================================
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// ================================
// COLLISION CHECK
// ================================
function isColliding(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

// ================================
// IMAGES
// ================================
const carImage = new Image();
carImage.src = "assets/car.png";

const roadImage = new Image();
roadImage.src = "assets/road.png";

const enemyImage = new Image();
enemyImage.src = "assets/enemy.png";

const coinImage = new Image();
coinImage.src = "assets/coin.png";

const nitroImage = new Image();
nitroImage.src = "assets/nitro.png";

const healthImage = new Image();
healthImage.src = "assets/health.png";

// ================================
// SOUNDS
// ================================
const engineSound = new Audio("assets/engine.mp3");
engineSound.loop = true;

const driftSound = new Audio("assets/drift.mp3");
const crashSound = new Audio("assets/crash.mp3");
const nitroSound = new Audio("assets/nitro.mp3");
const brakeSound = new Audio("assets/brake.mp3");

// ================================
// GAME OBJECTS
// ================================
const controls = new TouchControls();
const racer = new Racer(carImage);
const track = new Track(roadImage);
const camera = new Camera();

// ENEMIES
const enemies = [];
for (let i = 0; i < 5; i++) {
    enemies.push(
        new EnemyRacer(
            enemyImage,
            Math.random() * 2000 - 1000,
            Math.random() * 2000 - 1000
        )
    );
}

// ================================
// COUNTRY CHOICE (if using menu)
// ================================
window.chooseCountry = async function (country) {
    const res = await fetch("data/countries.json");
    const all = await res.json();

    const countryData = all[country];

    roadImage.src = countryData.road;

    racer.x = countryData.start.x;
    racer.y = countryData.start.y;

    document.getElementById("countryMenu").style.display = "none";

    // Start puzzle after country selection
    startPuzzle();
};

// ================================
// START PUZZLE FIRST
// ================================
function startPuzzle() {
    const puzzle = new Puzzle();

    // When puzzle is solved → main game starts
    window.startGameAfterPuzzle = () => {
        gameStarted = true;
    };
}

// ================================
// GAME LOOP
// ================================
function loop() {
    requestAnimationFrame(loop);

    // WAIT UNTIL PUZZLE IS DONE
    if (!gameStarted) return;

    // UPDATE
    controls.update();
    racer.update(controls);
    camera.update(racer);
    track.update(racer);
    enemies.forEach((e) => e.update(racer));

    // ================================
    // SOUND LOGIC
    // ================================
    if (racer.speed > 0.5) {
        if (engineSound.paused) engineSound.play();
    } else engineSound.pause();

    if (Math.abs(racer.turn) > 0.4 && racer.speed > 2) {
        if (driftSound.paused) driftSound.play();
    } else driftSound.pause();

    if (controls.brake && racer.speed > 1) brakeSound.play();

    if (controls.nitro && racer.nitroActive) {
        if (nitroSound.paused) nitroSound.play();
    }

    // ================================
    // ENEMY COLLISIONS
    // ================================
    enemies.forEach((enemy) => {
        if (isColliding(racer, enemy)) {
            crashSound.play();
            racer.takeDamage(20); // Your Racer.js handles health
        }
    });

    // ================================
    // DRAW
    // ================================
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    track.draw(ctx, camera);
    enemies.forEach((e) => e.draw(ctx, camera));
    racer.draw(ctx, camera);

    drawHUD();
}

loop();

// ================================
// HUD (Coins, Nitro, Health Bar)
// ================================
function drawHUD() {
    ctx.fillStyle = "white";
    ctx.font = "22px Arial";
    ctx.fillText("Speed: " + Math.round(racer.speed), 20, 40);

    // Coins
    ctx.fillText("Coins: " + racer.coins, 20, 70);

    // Health bar
    ctx.fillStyle = "red";
    ctx.fillRect(20, 100, 200, 20);

    ctx.fillStyle = "lime";
    ctx.fillRect(20, 100, (racer.health / 100) * 200, 20);

    ctx.strokeStyle = "white";
    ctx.strokeRect(20, 100, 200, 20);
}
