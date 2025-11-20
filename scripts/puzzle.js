// ===========================
// 🍬 CANDY CRUSH PUZZLE
// ===========================

const canvas = document.getElementById("puzzleCanvas");
const ctx = canvas.getContext("2d");

const ROWS = 8;
const COLS = 8;
const TILE = 50;

let grid = [];
let selected = null;
let animating = false;

// Candy colors
const colors = ["red", "yellow", "blue", "green", "orange"];

// ===========================
// CREATE RANDOM GRID
// ===========================
function createGrid() {
    grid = [];
    for (let r = 0; r < ROWS; r++) {
        let row = [];
        for (let c = 0; c < COLS; c++) {
            row.push(colors[Math.floor(Math.random() * colors.length)]);
        }
        grid.push(row);
    }
}

createGrid();

// ===========================
// DRAW GRID
// ===========================
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            ctx.fillStyle = grid[r][c];
            ctx.fillRect(c * TILE, r * TILE, TILE - 2, TILE - 2);
        }
    }
}

drawGrid();

// ===========================
// SWAP TWO TILES
// ===========================
function swap(a, b) {
    let temp = grid[a.r][a.c];
    grid[a.r][a.c] = grid[b.r][b.c];
    grid[b.r][b.c] = temp;
}

// ===========================
// CHECK MATCHES
// ===========================
function findMatches() {
    let matches = [];

    // Horizontal matches
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS - 2; c++) {
            if (
                grid[r][c] === grid[r][c + 1] &&
                grid[r][c] === grid[r][c + 2]
            ) {
                matches.push({ r, c });
                matches.push({ r, c: c + 1 });
                matches.push({ r, c: c + 2 });
            }
        }
    }

    // Vertical matches
    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS - 2; r++) {
            if (
                grid[r][c] === grid[r + 1][c] &&
                grid[r][c] === grid[r + 2][c]
            ) {
                matches.push({ r, c });
                matches.push({ r: r + 1, c });
                matches.push({ r: r + 2, c });
            }
        }
    }

    return matches;
}

// ===========================
// REMOVE MATCHES
// ===========================
function removeMatches(matches) {
    for (let m of matches) {
        grid[m.r][m.c] = null;
    }
}

// ===========================
// DROP TILES DOWN
// ===========================
function applyGravity() {
    for (let c = 0; c < COLS; c++) {
        for (let r = ROWS - 1; r >= 0; r--) {
            if (grid[r][c] === null) {
                for (let k = r - 1; k >= 0; k--) {
                    if (grid[k][c] !== null) {
                        grid[r][c] = grid[k][c];
                        grid[k][c] = null;
                        break;
                    }
                }
            }
        }
    }
}

// ===========================
// REFILL NEW TILES
// ===========================
function refillTiles() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (grid[r][c] === null) {
                grid[r][c] = colors[Math.floor(Math.random() * colors.length)];
            }
        }
    }
}

// ===========================
// CHECK IF PUZZLE IS SOLVED
// ===========================
function checkIfPuzzleSolved() {
    // Example rule: make any 2 matches
    puzzleMatches++;

    if (puzzleMatches >= 2) {
        endPuzzleAndStartGame();
    }
}

let puzzleMatches = 0;

// ===========================
// USER CLICK HANDLING
// ===========================
canvas.addEventListener("click", (e) => {
    if (animating) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const c = Math.floor(x / TILE);
    const r = Math.floor(y / TILE);

    if (!selected) {
        selected = { r, c };
        return;
    }

    // Only allow swapping adjacent tiles
    if (Math.abs(selected.r - r) + Math.abs(selected.c - c) === 1) {
        animating = true;

        swap(selected, { r, c });

        let matches = findMatches();

        if (matches.length === 0) {
            // Swap back if no match
            swap(selected, { r, c });
            animating = false;
            selected = null;
            drawGrid();
            return;
        }

        // MATCH FOUND
        checkIfPuzzleSolved();

        removeMatches(matches);
        applyGravity();
        refillTiles();

        selected = null;
        animating = false;
        drawGrid();
    } else {
        selected = { r, c };
    }
});

// ===========================
// START GAME AFTER PUZZLE
// ===========================
function endPuzzleAndStartGame() {
    document.getElementById("puzzle-screen").style.display = "none";
    document.getElementById("game-container").style.display = "block";
    document.getElementById("countryMenu").style.display = "block";

    // Start game loop in main.js
    if (window.startGame) {
        window.startGame();
    }
}

export { endPuzzleAndStartGame };
