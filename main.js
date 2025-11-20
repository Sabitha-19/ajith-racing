import TouchControls from "./scripts/TouchControls.js";
import Racer from "./scripts/Racer.js";
import Track from "./scripts/Track.js";
import Camera from "./scripts/Camera.js";
import EnemyRacer from "./scripts/EnemyRacer.js";
import PowerUp from "./scripts/PowerUp.js";

let selectedCountry = null;
let countryData = null;

// Canvas setup
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// Collision Function
function isColliding(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

// Load images
const carImage = new Image();
carImage.src = "assets/car.png";

const roadImage = new Image();
roadImage.src = "assets/road.png";

const enemyImage = new Image();
enemyImage.src = "assets/enemy.png";

// Power-Up Images
const coinImage = new Image();
coinImage.src = "assets/coin.png";

const nitroImage = new Image();
nitroImage.src = "assets/nitro.png";

const healthImage = new Image();
healthImage.src = "assets/health.png";


// Load Sounds
const engineSound = new Audio("assets/engine.mp3");
engineSound.loop = true;

const driftSound = new Audio("assets/drift.mp3");
const crashSound = new Audio("assets/crash.mp3");
const nitroSound = new Audio("assets/nitro.mp3");
const brakeSound = new Audio("assets/brake.mp3");


// Game Objects
const controls = new TouchControls();
const racer = new Racer(carImage);
const track = new Track(roadImage);
const camera = new Camera();

// Enemy Racers
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

// Power-Ups
const powerUps = [
    new PowerUp(coinImage, 300, 200, "coin"),
    new PowerUp(coinImage, 600, -200, "coin"),
    new PowerUp(nitroImage, 1200, 400, "nitro"),
    new PowerUp(healthImage, -500, 900, "health"),
];

let score = 0;

// Country selection (if menu exists)
async function chooseCountry(country) {
    const res = await fetch("data/countries.json");
    const all = await res.json();
    selectedCountry = country;
    countryData = all[country];

    roadImage.src = countryData.road;

    racer.x = countryData.start.x;
    racer.y = countryData.start.y;

    document.getElementById("countryMenu").style.display = "none";
}

// Game loop
function loop() {
    requestAnimationFrame(loop);

    // Update
    controls.update();
    racer.update(controls);
    camera.update(racer);
    track.update(racer);
    enemies.forEach(e => e.update(racer));
    powerUps.forEach(p => p.update());

    // === SOUND SYSTEM ===
    if (racer.speed > 0.5) {
        if (engineSound.paused) engineSound.play();
    } else {
        engineSound.pause();
    }

    if (Math.abs(racer.turn) > 0.4 && racer.speed > 2) {
        if (driftSound.paused) driftSound.play();
    } else {
        driftSound.pause();
    }

    if (controls.brake && racer.speed > 1) {
        brakeSound.play();
    }

    if (controls.nitro && racer.nitroActive) {
        if (nitroSound.paused) nitroSound.play();
    }

    // === COLLISION WITH ENEMIES ===
    for (const enemy of enemies) {
        if (isColliding(racer, enemy)) {
            crashSound.play();
            racer.x = 200;
            racer.y = 400;
            racer.speed = 0;
        }
    }

    // === POWER-UP COLLISION ===
    for (const p of powerUps) {
        if (isColliding(racer, p)) {

            if (p.type === "coin") score++;

            if (p.type === "nitro") racer.nitro = 100;

            if (p.type === "health")
                racer.health = Math.min(100, racer.health + 30);

            // respawn
            p.x = Math.random() * 2000 - 1000;
            p.y = Math.random() * 2000 - 1000;
        }
    }

    // Draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    track.draw(ctx, camera);
    powerUps.forEach(p => p.draw(ctx, camera));
    racer.draw(ctx, camera);
    enemies.forEach(e => e.draw(ctx, camera));

    // HUD
    ctx.fillStyle = "white";
    ctx.font = "22px Arial";
    ctx.fillText("Speed: " + Math.round(racer.speed), 20, 40);
    ctx.fillText("Coins: " + score, 20, 70);
}

loop();
