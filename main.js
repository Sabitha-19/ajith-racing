// ===============================
// IMPORT TOUCH CONTROLS
// ===============================
import TouchControls from "./scripts/TouchControls.js";
import Racer from "./scripts/Racer.js";

// ===============================
// MAIN GAME SETUP
// ===============================
let canvas, ctx;
let racer;
let controls;

window.onload = () => {
    setup();
    gameLoop();
};

function setup() {
    // Create canvas
    canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    document.getElementById("game-container").appendChild(canvas);
    ctx = canvas.getContext("2d");

    // Create the racer
    racer = new Racer();

    // Create touch controls (mobile)
    controls = new TouchControls();
}

// ===============================
// GAME LOOP
// ===============================
function gameLoop() {
    update();
    draw();

    requestAnimationFrame(gameLoop);
}

function update() {
    const input = controls.getInput();

    racer.update(input);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    racer.draw(ctx);
}
