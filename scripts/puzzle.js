export default class Puzzle {
    constructor() {
        this.size = 6; // 6x6 candy grid
        this.candies = ["red", "blue", "green", "yellow", "purple"];
        this.grid = [];

        this.canvas = document.createElement("canvas");
        this.canvas.width = 360;
        this.canvas.height = 360;
        this.canvas.style.position = "absolute";
        this.canvas.style.top = "50%";
        this.canvas.style.left = "50%";
        this.canvas.style.transform = "translate(-50%, -50%)";
        this.canvas.style.border = "4px solid white";
        this.canvas.style.zIndex = 999;
        this.canvas.style.background = "#222";

        this.ctx = this.canvas.getContext("2d");

        this.selected = null;
        this.isSolved = false;

        this.generateGrid();
        this.draw();

        this.canvas.addEventListener("click", (e) =>
            this.handleClick(e)
        );

        document.body.appendChild(this.canvas);
    }

    generateGrid() {
        for (let y = 0; y < this.size; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.size; x++) {
                this.grid[y][x] =
                    this.candies[Math.floor(Math.random() * this.candies.length)];
            }
        }
    }

    draw() {
        const tile = 60;
        this.ctx.clearRect(0, 0, 360, 360);

        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                this.ctx.fillStyle = this.grid[y][x];
                this.ctx.fillRect(x * tile, y * tile, tile - 4, tile - 4);
            }
        }

        if (this.selected) {
            this.ctx.strokeStyle = "white";
            this.ctx.lineWidth = 4;
            this.ctx.strokeRect(
                this.selected.x * tile,
                this.selected.y * tile,
                tile - 4,
                tile - 4
            );
        }
    }

    handleClick(e) {
        const bounds = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - bounds.left) / 60);
        const y = Math.floor((e.clientY - bounds.top) / 60);

        if (!this.selected) {
            this.selected = { x, y };
        } else {
            this.swap(this.selected, { x, y });
            this.selected = null;
        }

        this.draw();
    }

    swap(a, b) {
        const temp = this.grid[a.y][a.x];
        this.grid[a.y][a.x] = this.grid[b.y][b.x];
        this.grid[b.y][b.x] = temp;

        this.checkMatch();
    }

    checkMatch() {
        // simple puzzle win condition
        // if any 3 same colors in a row → puzzle solved

        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size - 2; x++) {
                const c = this.grid[y][x];
                if (
                    c === this.grid[y][x + 1] &&
                    c === this.grid[y][x + 2]
                ) {
                    this.complete();
                }
            }
        }
    }

    complete() {
        this.isSolved = true;

        this.canvas.style.transition = "0.8s";
        this.canvas.style.opacity = 0;

        setTimeout(() => {
            this.canvas.remove();
        }, 900);

        // Trigger the game to start
        window.startGameAfterPuzzle();
    }
}
