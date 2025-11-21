import Racer from "./Racer.js";
import Track from "./Track.js";
import Camera from "./Camera.js";
import TouchControls from "./TouchControls.js";
import Puzzle from "./Puzzle.js";

const canvas = document.createElement("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.getElementById("game-container").appendChild(canvas);

const ctx = canvas.getContext("2d");

let racer, track, camera, controls;

function startGame() {
    racer = new Racer();
    track = new Track();
    controls = new TouchControls();
    camera = new Camera(racer);

    controls.onNitroPressed = () => racer.activateNitro();

    requestAnimationFrame(gameLoop);
}

new Puzzle(() => {
    // Puzzle completed → show country selection
    showCountryMenu();
});

function showCountryMenu() {
    const menu = document.createElement("div");
    menu.style.position = "absolute";
    menu.style.left = "50%";
    menu.style.top = "50%";
    menu.style.transform = "translate(-50%, -50%)";
    menu.style.background = "white";
    menu.style.padding = "20px";
    menu.style.borderRadius = "10px";

    menu.innerHTML = `
        <h2>Select Country</h2>
        <button id="ind">India</button>
        <button id="usa">USA</button>
        <button id="jpn">Japan</button>
    `;

    document.body.appendChild(menu);

    menu.querySelector("#ind").onclick = () => {
        menu.remove();
        startGame();
    };
    menu.querySelector("#usa").onclick = () => {
        menu.remove();
        startGame();
    };
    menu.querySelector("#jpn").onclick = () => {
        menu.remove();
        startGame();
    };
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    racer.update(controls);
    camera.update();
    track.draw(ctx, camera);

    // Draw player as rectangle
    ctx.fillStyle = "red";
    ctx.fillRect(
        canvas.width / 2 - 10,
        canvas.height - 80,
        20,
        40
    );

    requestAnimationFrame(gameLoop);
}
