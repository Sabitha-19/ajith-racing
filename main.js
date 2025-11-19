import TouchControls from "./scripts/TouchControls.js";
import Racer from "./scripts/Racer.js";
import Track from "./scripts/Track.js";
import Camera from "./scripts/Camera.js";
import EnemyRacer from "./scripts/EnemyRacer.js";


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

