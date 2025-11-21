// -------------------------------
// MAIN GAME CONTROLLER
// -------------------------------

// Global state
let gameState = {
    puzzleSolved: false,
    countrySelected: false,
    selectedCountry: null,
    debug: false,   // turn to true for debug UI
};

// DOM elements
const puzzleContainer = document.getElementById("puzzle-container");
const menuContainer = document.getElementById("menu-container");
const gameContainer = document.getElementById("game-container");

// -------------------------------
// 1️⃣ SHOW PUZZLE FIRST
// -------------------------------
function startPuzzle() {
    const puzzle = new Puzzle(puzzleContainer);

    puzzle.onSolved(() => {
        console.log("Puzzle solved!");

        gameState.puzzleSolved = true;
        puzzleContainer.style.display = "none";

        showCountryMenu();
    });
}

startPuzzle();

// -------------------------------
// 2️⃣ COUNTRY MENU
// -------------------------------
function showCountryMenu() {
    menuContainer.innerHTML = `
        <div class="country-menu">
            <h2>Select Your Country</h2>
            <button class="country-btn" data-country="India">India</button>
            <button class="country-btn" data-country="USA">USA</button>
            <button class="country-btn" data-country="Japan">Japan</button>
        </div>
    `;

    menuContainer.style.display = "block";

    document.querySelectorAll(".country-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const country = btn.getAttribute("data-country");

            console.log("Country Selected:", country);

            gameState.countrySelected = true;
            gameState.selectedCountry = country;

            menuContainer.style.display = "none";

            startRaceGame(country);
        });
    });
}

// -------------------------------
// 3️⃣ START THE RACING GAME
// -------------------------------
function startRaceGame(country) {
    console.log("Starting game for:", country);

    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 500;
    gameContainer.appendChild(canvas);

    const ctx = canvas.getContext("2d");

    const track = new Track(canvas.width, canvas.height);
    const racer = new Racer(track.startX, track.startY);
    const camera = new Camera(racer, canvas.width, canvas.height);

    const controls = new TouchControls();
    controls.attach();

    // DEBUG UI
    if (gameState.debug) {
        const debugBox = document.createElement("div");
        debugBox.className = "debug-box";
        gameContainer.appendChild(debugBox);

        setInterval(() => {
            debugBox.innerHTML = `
                Speed: ${racer.speed.toFixed(2)}<br>
                X: ${racer.x.toFixed(1)}<br>
                Y: ${racer.y.toFixed(1)}<br>
            `;
        }, 100);
    }

    // GAME LOOP
    function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        racer.update(controls);
        camera.update();

        track.draw(ctx, camera);
        racer.draw(ctx, camera);

        requestAnimationFrame(loop);
    }

    loop();
}
