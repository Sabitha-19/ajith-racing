import TouchControls from "./scripts/TouchControls.js";
import Racer from "./scripts/Racer.js";
import Track from "./scripts/Track.js";
import Camera from "./scripts/Camera.js";
import EnemyRacer from "./scripts/EnemyRacer.js";

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

// Load images
const carImage = new Image();
carImage.src = "assets/car.png";

const roadImage = new Image();
roadImage.src = "assets/road.png";

const enemyImage = new Image();
enemyImage.src = "assets/enemy.png";

// Load Sound Effects
const engineSound = new Audio("assets/sounds/engine.mp3");
engineSound.loop = true;
engineSound.volume = 0.4;

const driftSound = new Audio("assets/sounds/drift.mp3");
driftSound.volume = 0.6;

const nitroSound = new Audio("assets/sounds/nitro.mp3");
nitroSound.volume = 0.8;



// Create systems
const controls = new TouchControls();
const racer = new Racer(carImage);
const track = new Track(roadImage);
const camera = new Camera();

// Create enemy racers
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


async function chooseCountry(country) {
    const res = await fetch("data/countries.json");
    const all = await res.json();
    selectedCountry = country;
    countryData = all[country];

    // Load road + background
    roadImage.src = countryData.road;
    bgImage.src = countryData.background;

    // Set start position
    racer.x = countryData.start.x;
    racer.y = countryData.start.y;

    // Hide menu
    document.getElementById("countryMenu").style.display = "none";
}

// Game Loop
function loop() {
    requestAnimationFrame(loop);

    // Update
    controls.update();
    racer.update(controls);
    camera.update(racer);
    track.update(racer);
enemies.forEach(e => e.update(racer));


    // Draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    track.draw(ctx, camera);
    racer.draw(ctx, camera);
    // Draw AI enemies
enemies.forEach(e => e.draw(ctx, camera));


    // HUD (speed display)
    ctx.fillStyle = "white";
    ctx.font = "22px Arial";
    ctx.fillText("Speed: " + Math.round(racer.speed), 20, 40);
}
loop();



