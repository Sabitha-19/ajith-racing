// =====================================
//             PUZZLE SYSTEM
// =====================================

export default class Puzzle {
    constructor(uiManager) {
        this.ui = uiManager;

        this.active = true;       // puzzle is shown first
        this.solved = false;

        // Simple puzzle: Drag correct number into the box
        this.answer = "7";        // you can change any time

        this.dragging = false;
        this.dragX = 0;
        this.dragY = 0;

        // Answer piece start position
        this.startX = 140;
        this.startY = 260;

        // Current position
        this.x = this.startX;
        this.y = this.startY;

        // Drop zone
        this.zoneX = 140;
        this.zoneY = 90;
        this.zoneSize = 120;
    }

    // -----------------------------
    //  MOUSE / TOUCH EVENTS
    // -----------------------------
    onDown(mx, my) {
        if (!this.active) return;

        const dx = mx - this.x;
        const dy = my - this.y;

        if (Math.abs(dx) < 40 && Math.abs(dy) < 40) {
            this.dragging = true;
        }
    }

    onMove(mx, my) {
        if (!this.active) return;

        if (this.dragging) {
            this.x = mx;
            this.y = my;
        }
    }

    onUp(mx, my) {
        if (!this.active) return;

        if (!this.dragging) return;

        this.dragging = false;

        // Check drop zone match
        const dx = this.x - this.zoneX;
        const dy = this.y - this.zoneY;

        if (Math.abs(dx) < 60 && Math.abs(dy) < 60) {
            this.solve();
        } else {
            // Reset back
            this.x = this.startX;
            this.y = this.startY;
        }
    }

    // -----------------------------
    //             SOLVED
    // -----------------------------
    solve() {
        this.solved = true;
        this.active = false;

        // show country selection
        this.ui.showCountryMenu();
    }

    // -----------------------------
    //            DRAW PUZZLE
    // -----------------------------
    draw(ctx) {
        if (!this.active) return;

        // Background
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Title
        ctx.fillStyle = "white";
        ctx.font = "28px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Solve Puzzle to Start Race", ctx.canvas.width / 2, 50);

        // Drop zone
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 4;
        ctx.strokeRect(
            this.zoneX - this.zoneSize / 2,
            this.zoneY - this.zoneSize / 2,
            this.zoneSize,
            this.zoneSize
        );

        ctx.font = "22px Arial";
        ctx.fillText("Drop Here", this.zoneX, this.zoneY + 60);

        // Draggable block
        ctx.fillStyle = "#00aaff";
        ctx.beginPath();
        ctx.roundRect(this.x - 40, this.y - 40, 80, 80, 10);
        ctx.fill();

        ctx.fillStyle = "white";
        ctx.font = "40px Arial";
        ctx.fillText(this.answer, this.x, this.y + 12);
    }
}
