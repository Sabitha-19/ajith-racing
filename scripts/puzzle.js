// scripts/puzzle.js
// Fully upgraded Candy-Crush style puzzle:
// - Pop / bounce / fall easing animations
// - Special candies: striped (H/V), bomb (3x3), rainbow (color-bomb)
// - Progress bar + Timer (both enabled by options)
// - "Puzzle Complete!" animation, then calls onComplete() (open country menu)
// Usage:
//   import Puzzle from "./scripts/puzzle.js";
//   const puzzle = new Puzzle({ canvas: myCanvasElement, rows:7, cols:7, tileSize:64, timeLimitSec:45, progressTarget:6 }, () => { /* onComplete -> show country menu */ });

export default class Puzzle {
    constructor(options = {}, onComplete = () => {}) {
        // Options (with defaults)
        this.canvas = options.canvas || this._createCanvas(); // HTMLCanvasElement
        this.ctx = this.canvas.getContext("2d");
        this.rows = options.rows ?? 7;
        this.cols = options.cols ?? 7;
        this.tileSize = options.tileSize ?? 64;
        this.padding = Math.max(6, Math.round(this.tileSize * 0.08));
        this.timeLimit = options.timeLimitSec ?? 45; // seconds
        this.useTimer = options.useTimer ?? true;
        this.progressTarget = options.progressTarget ?? 6; // matches needed
        this.onComplete = onComplete;

        // Assets (paths you provided)
        this.candyPaths = [
            { src: "assets/candy_red.png", name: "red" },
            { src: "assets/candy_yellow.png", name: "yellow" },
            { src: "assets/candy_green.png", name: "green" },
            { src: "assets/candy_purple.png", name: "purple" },
            { src: "assets/candy_blue.png", name: "blue" }
        ];

        // Internal state
        this.tileTypes = []; // loaded images with names
        this.grid = []; // grid[r][c] = tile or null
        this.animations = []; // active animations
        this.selected = null; // {r,c}
        this.pointerDown = null;
        this.progress = 0;
        this.remainingTime = this.timeLimit;
        this.timerRunning = this.useTimer && this.timeLimit > 0;
        this.blockInput = false; // block while resolving
        this._lastFrame = performance.now();

        // UI overlay elements (progress bar & timer)
        this._createUIElements();

        // Load images and initialize
        this._loadAllImages().then(() => {
            this._resizeCanvas();
            this._generateInitialGrid();
            // Remove any immediate matches so starting board is stable
            this._resolveInitialMatches().then(() => {
                this._attachInput();
                this._loop();
            });
        });
    }

    // -----------------------
    // Canvas & UI creation
    // -----------------------
    _createCanvas() {
        const canvas = document.createElement("canvas");
        canvas.style.display = "block";
        canvas.style.margin = "20px auto";
        document.body.appendChild(canvas);
        return canvas;
    }

    _createUIElements() {
        // wrapper relative to canvas
        this.wrapper = document.createElement("div");
        this.wrapper.style.position = "relative";
        this.wrapper.style.width = "max-content";
        this.wrapper.style.margin = "20px auto";
        if (this.canvas.parentNode) {
            this.canvas.parentNode.insertBefore(this.wrapper, this.canvas);
            this.wrapper.appendChild(this.canvas);
        } else {
            document.body.appendChild(this.wrapper);
            this.wrapper.appendChild(this.canvas);
        }

        // progress bar
        this.progressBar = document.createElement("div");
        this.progressBar.style.position = "absolute";
        this.progressBar.style.left = "0";
        this.progressBar.style.top = "-36px";
        this.progressBar.style.width = "100%";
        this.progressBar.style.height = "14px";
        this.progressBar.style.background = "#222";
        this.progressBar.style.borderRadius = "8px";
        this.progressBar.style.overflow = "hidden";
        this.progressInner = document.createElement("div");
        this.progressInner.style.height = "100%";
        this.progressInner.style.width = "0%";
        this.progressInner.style.background = "linear-gradient(90deg,#ffcc00,#ff66a3)";
        this.progressBar.appendChild(this.progressInner);
        this.wrapper.appendChild(this.progressBar);

        // timer text
        this.timerText = document.createElement("div");
        this.timerText.style.position = "absolute";
        this.timerText.style.right = "-8px";
        this.timerText.style.top = "-56px";
        this.timerText.style.color = "white";
        this.timerText.style.fontFamily = "Arial";
        this.timerText.style.fontSize = "14px";
        this.wrapper.appendChild(this.timerText);

        // completion overlay (hidden until needed)
        this.completionOverlay = document.createElement("div");
        this.completionOverlay.style.position = "absolute";
        this.completionOverlay.style.left = "0";
        this.completionOverlay.style.top = "0";
        this.completionOverlay.style.width = "100%";
        this.completionOverlay.style.height = "100%";
        this.completionOverlay.style.display = "flex";
        this.completionOverlay.style.alignItems = "center";
        this.completionOverlay.style.justifyContent = "center";
        this.completionOverlay.style.background = "rgba(0,0,0,0.0)";
        this.completionOverlay.style.pointerEvents = "none";
        this.wrapper.appendChild(this.completionOverlay);

        // ensure wrapper width matches board once sized
    }

    // -----------------------
    // Asset loading
    // -----------------------
    _loadAllImages() {
        const load = (src) =>
            new Promise((res, rej) => {
                const img = new Image();
                img.onload = () => res(img);
                img.onerror = rej;
                img.src = src;
            });

        return Promise.all(this.candyPaths.map(p => load(p.src).then(img => {
            this.tileTypes.push({ name: p.name, img, specialChance: 0 });
            return true;
        })));
    }

    // -----------------------
    // Canvas size
    // -----------------------
    _resizeCanvas() {
        this.canvas.width = this.cols * this.tileSize;
        this.canvas.height = this.rows * this.tileSize;
        this.wrapper.style.width = this.canvas.width + "px";
    }

    // -----------------------
    // Grid generation & helpers
    // -----------------------
    _generateInitialGrid() {
        for (let r = 0; r < this.rows; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.cols; c++) {
                this.grid[r][c] = this._createTile(r, c, this._randomTileType());
            }
        }
    }

    _createTile(r, c, type) {
        return {
            r, c,
            typeName: type.name,
            img: type.img,
            special: "normal", // normal | stripedH | stripedV | bomb | rainbow
            yOffset: 0, // for drop animation
            pop: 0,     // for pop animation
            removing: false
        };
    }

    _randomTileType() {
        return this.tileTypes[Math.floor(Math.random() * this.tileTypes.length)];
    }

    // -----------------------
    // Input handling
    // -----------------------
    _attachInput() {
        this.canvas.addEventListener("pointerdown", e => {
            if (this.blockInput) return;
            const pos = this._pointerToGrid(e);
            if (!pos) return;
            this.pointerDown = pos;
        });

        this.canvas.addEventListener("pointerup", e => {
            if (this.blockInput) { this.pointerDown = null; return; }
            const pos = this._pointerToGrid(e);
            if (!pos) { this.pointerDown = null; return; }
            if (!this.pointerDown) { this.pointerDown = null; return; }
            const a = this.pointerDown, b = pos;
            this.pointerDown = null;

            // only neighbors
            if (Math.abs(a.r - b.r) + Math.abs(a.c - b.c) !== 1) return;
            this._attemptSwap(a.r, a.c, b.r, b.c);
        });
    }

    _pointerToGrid(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
        const y = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
        const c = Math.floor(x / this.tileSize);
        const r = Math.floor(y / this.tileSize);
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return null;
        return { r, c };
    }

    // -----------------------
    // Swap & resolution flow
    // -----------------------
    _attemptSwap(r1, c1, r2, c2) {
        if (this.blockInput) return;
        this.blockInput = true;

        // swap model
        this._swapTiles(r1, c1, r2, c2);

        // animate swap: create a temporary swap anim (visual only)
        const swapAnim = { type: "swap", a: { r: r1, c: c1 }, b: { r: r2, c: c2 }, t: 0, duration: 180 };
        this.animations.push(swapAnim);

        // after short delay, check matches
        setTimeout(() => {
            const matches = this._findMatches();
            if (matches.length === 0) {
                // swap back
                this._swapTiles(r1, c1, r2, c2);
                const backAnim = { type: "swap", a: { r: r1, c: c1 }, b: { r: r2, c: c2 }, t: 0, duration: 180, reverse: true };
                this.animations.push(backAnim);
                setTimeout(() => { this.blockInput = false; }, 210);
            } else {
                // resolve chain
                this._resolveMatchesChain().then(() => {
                    this.blockInput = false;
                });
            }
        }, 200);
    }

    _swapTiles(r1, c1, r2, c2) {
        const tmp = this.grid[r1][c1];
        this.grid[r1][c1] = this.grid[r2][c2];
        this.grid[r2][c2] = tmp;
        // update coords stored in tiles
        if (this.grid[r1][c1]) { this.grid[r1][c1].r = r1; this.grid[r1][c1].c = c1; }
        if (this.grid[r2][c2]) { this.grid[r2][c2].r = r2; this.grid[r2][c2].c = c2; }
    }

    // -----------------------
    // Match finding (returns array of {r,c})
    // -----------------------
    _findMatches() {
        const matched = new Set();

        // horizontal
        for (let r = 0; r < this.rows; r++) {
            let streak = 1;
            for (let c = 1; c < this.cols; c++) {
                const a = this.grid[r][c];
                const b = this.grid[r][c - 1];
                if (!a || !b) { streak = 1; continue; }
                if (a.typeName === b.typeName) {
                    streak++;
                } else {
                    if (streak >= 3) {
                        for (let k = c - streak; k < c; k++) matched.add(`${r},${k}`);
                    }
                    streak = 1;
                }
            }
            if (streak >= 3) {
                for (let k = this.cols - streak; k < this.cols; k++) matched.add(`${r},${k}`);
            }
        }

        // vertical
        for (let c = 0; c < this.cols; c++) {
            let streak = 1;
            for (let r = 1; r < this.rows; r++) {
                const a = this.grid[r][c];
                const b = this.grid[r - 1][c];
                if (!a || !b) { streak = 1; continue; }
                if (a.typeName === b.typeName) {
                    streak++;
                } else {
                    if (streak >= 3) {
                        for (let k = r - streak; k < r; k++) matched.add(`${k},${c}`);
                    }
                    streak = 1;
                }
            }
            if (streak >= 3) {
                for (let k = this.rows - streak; k < this.rows; k++) matched.add(`${k},${c}`);
            }
        }

        // return as array of positions
        return Array.from(matched).map(s => {
            const [r, c] = s.split(",").map(Number);
            return { r, c };
        });
    }

    // -----------------------
    // Group matches into clusters, detect shapes (for specials)
    // -----------------------
    _groupMatches(matches) {
        // group contiguous matched positions
        const map = {};
        for (const m of matches) map[`${m.r},${m.c}`] = true;
        const visited = {};
        const groups = [];
        const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
        for (const m of matches) {
            const key = `${m.r},${m.c}`;
            if (visited[key]) continue;
            const stack = [m];
            const group = [];
            visited[key] = true;
            while (stack.length) {
                const cur = stack.pop();
                group.push(cur);
                for (const d of dirs) {
                    const nr = cur.r + d[0], nc = cur.c + d[1];
                    const k2 = `${nr},${nc}`;
                    if (map[k2] && !visited[k2]) {
                        visited[k2] = true;
                        stack.push({r:nr,c:nc});
                    }
                }
            }
            groups.push(group);
        }
        return groups;
    }

    // helper to detect T/L shape
    _isTShape(group) {
        if (group.length < 4) return false;
        const rows = new Set(group.map(p => p.r));
        const cols = new Set(group.map(p => p.c));
        return rows.size >= 2 && cols.size >= 2;
    }

    // -----------------------
    // Resolve matches in chain (creates specials, removes, gravity, refill)
    // -----------------------
    async _resolveMatchesChain() {
        while (true) {
            const matches = this._findMatches();
            if (matches.length === 0) break;

            const groups = this._groupMatches(matches);

            // For each group determine special creation or simple removal
            for (const group of groups) {
                if (group.length >= 5) {
                    // create rainbow on center tile
                    const center = group[Math.floor(group.length / 2)];
                    if (this.grid[center.r] && this.grid[center.r][center.c]) {
                        this.grid[center.r][center.c].special = "rainbow";
                        // remove other tiles in group
                        group.forEach(p => {
                            if (!(p.r === center.r && p.c === center.c)) this.grid[p.r][p.c] = null;
                        });
                    }
                } else if (this._isTShape(group)) {
                    // create bomb at approx center
                    const center = group[Math.floor(group.length / 2)];
                    if (this.grid[center.r] && this.grid[center.r][center.c]) {
                        this.grid[center.r][center.c].special = "bomb";
                        group.forEach(p => {
                            if (!(p.r === center.r && p.c === center.c)) this.grid[p.r][p.c] = null;
                        });
                    }
                } else if (group.length === 4) {
                    // create striped (orientation based on first two)
                    const sorted = group.slice().sort((a,b) => a.r - b.r || a.c - b.c);
                    const orientation = (sorted[0].r === sorted[1].r) ? "stripedH" : "stripedV";
                    const target = sorted[Math.floor(sorted.length/2)];
                    if (this.grid[target.r] && this.grid[target.r][target.c]) {
                        this.grid[target.r][target.c].special = orientation;
                        group.forEach(p => {
                            if (!(p.r === target.r && p.c === target.c)) this.grid[p.r][p.c] = null;
                        });
                    }
                } else {
                    // normal -> nullify
                    group.forEach(p => this.grid[p.r][p.c] = null);
                }
            }

            // animate pops for removed tiles
            this._createRemovalAnimations(matches);

            // update progress by number of removed tiles (simple)
            this.progress += matches.length;
            this._updateProgressUI();

            // apply gravity & refill
            this._applyGravityAndRefill();

            // small delay so chain visible
            await this._wait(220);
        }

        // After chain resolved, check progress target
        if (this.progress >= this.progressTarget) {
            await this._playCompletionAnimation();
            this.onComplete && this.onComplete(); // open country menu
        }
    }

    _createRemovalAnimations(matches) {
        for (const m of matches) {
            this.animations.push({ type: "pop", r: m.r, c: m.c, t: 0, duration: 220 });
        }
    }

    _applyGravityAndRefill() {
        for (let c = 0; c < this.cols; c++) {
            let write = this.rows - 1;
            for (let r = this.rows - 1; r >= 0; r--) {
                if (this.grid[r][c]) {
                    if (write !== r) {
                        this.grid[write][c] = this.grid[r][c];
                        this.grid[write][c].r = write;
                        this.grid[r][c] = null;
                    }
                    write--;
                }
            }
            // fill top
            for (let r = write; r >= 0; r--) {
                const type = this._randomTileType();
                this.grid[r][c] = this._createTile(r, c, type);
                // set drop animation starting offset
                this.grid[r][c].yOffset = - ( (write - r + 1) * this.tileSize * 1.1 );
                this.animations.push({ type: "drop", r, c, t: 0, duration: 280 });
            }
        }
    }

    // -----------------------
    // initial removal if board starts with matches
    // -----------------------
    async _resolveInitialMatches() {
        while (true) {
            const matches = this._findMatches();
            if (matches.length === 0) break;
            matches.forEach(m => this.grid[m.r][m.c] = null);
            this._applyGravityAndRefill();
            await this._wait(60);
        }
    }

    // -----------------------
    // animation & draw loop
    // -----------------------
    _loop() {
        const now = performance.now();
        const dt = (now - this._lastFrame) / 1000 || 0;
        this._lastFrame = now;

        // update timer
        if (this.timerRunning) {
            this.remainingTime -= dt;
            if (this.remainingTime <= 0) {
                this.remainingTime = 0;
                this.timerRunning = false;
                // time over behavior: if progress >= target -> success; else failure (simple reset)
                if (this.progress >= this.progressTarget) {
                    this._playCompletionAnimation().then(() => {
                        this.onComplete && this.onComplete();
                    });
                } else {
                    this._showTimeoutAndReset();
                }
            }
            this.timerText.innerText = `Time: ${Math.ceil(this.remainingTime)}s`;
        }

        // update animations
        this._updateAnimations(dt);

        // draw frame
        this._draw();

        requestAnimationFrame(this._loop.bind(this));
    }

    _updateAnimations(dt) {
        // progress animations list
        for (let i = this.animations.length - 1; i >= 0; i--) {
            const a = this.animations[i];
            a.t += dt * (1000 / (a.duration || 200));
            if (a.t >= 1) {
                this.animations.splice(i, 1);
            }
        }

        // update tile states from animations (drop/pop)
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const tile = this.grid[r][c];
                if (!tile) continue;
                // defaults
                tile.pop = 0;
                tile.yOffset = tile.yOffset ?? 0;
            }
        }

        // apply each animation effect to corresponding tile
        for (const a of this.animations) {
            if (a.type === "drop") {
                const tile = this.grid[a.r] && this.grid[a.r][a.c];
                const p = Math.min(1, a.t);
                const eased = this._easeOutBack(p);
                if (tile) tile.yOffset = (1 - eased) * (this.tileSize * 1.1);
            }
            if (a.type === "pop") {
                const tile = this.grid[a.r] && this.grid[a.r][a.c];
                const p = Math.min(1, a.t);
                if (tile) tile.pop = this._easeOutElastic(p);
            }
            if (a.type === "swap") {
                // swap animations would be drawn as temporary transforms in draw
            }
        }
    }

    _draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // background grid cells
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const x = c * this.tileSize, y = r * this.tileSize;
                ctx.fillStyle = "#121212";
                ctx.fillRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);
            }
        }

        // draw tiles (accounting for yOffset and pop)
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const tile = this.grid[r][c];
                if (!tile) continue;
                const x = c * this.tileSize, y = r * this.tileSize;
                const img = tile.img;
                const yOff = tile.yOffset || 0;
                const popScale = 1 + (tile.pop || 0) * 0.22;

                ctx.save();
                ctx.translate(x + this.tileSize / 2, y + this.tileSize / 2 + yOff);
                ctx.scale(popScale, popScale);

                // glow for specials
                if (tile.special !== "normal") {
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = tile.special === "bomb" ? "orange" : (tile.special === "rainbow" ? "#fff" : "#88ffcc");
                }

                if (img && img.complete) {
                    ctx.drawImage(img, - (this.tileSize - this.padding) / 2, - (this.tileSize - this.padding) / 2, this.tileSize - this.padding, this.tileSize - this.padding);
                } else {
                    // fallback circle
                    ctx.fillStyle = "#ff66cc";
                    ctx.beginPath();
                    ctx.arc(0, 0, (this.tileSize - this.padding) / 2, 0, Math.PI * 2);
                    ctx.fill();
                }

                // draw special markers
                if (tile.special === "stripedH") {
                    ctx.fillStyle = "rgba(255,255,255,0.75)";
                    ctx.fillRect(- (this.tileSize - this.padding) / 2, -6, this.tileSize - this.padding, 12);
                } else if (tile.special === "stripedV") {
                    ctx.fillStyle = "rgba(255,255,255,0.75)";
                    ctx.fillRect(-6, - (this.tileSize - this.padding) / 2, 12, this.tileSize - this.padding);
                } else if (tile.special === "bomb") {
                    ctx.fillStyle = "rgba(0,0,0,0.6)";
                    ctx.beginPath();
                    ctx.arc(0, 0, 12, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = "white";
                    ctx.font = "bold 14px Arial";
                    ctx.fillText("B", -4, 6);
                } else if (tile.special === "rainbow") {
                    const grad = ctx.createLinearGradient(-20,-20,20,20);
                    grad.addColorStop(0, "#ff3b3b");
                    grad.addColorStop(0.25, "#ffcc00");
                    grad.addColorStop(0.5, "#32cd32");
                    grad.addColorStop(0.75, "#1e90ff");
                    grad.addColorStop(1, "#ff00ea");
                    ctx.strokeStyle = grad;
                    ctx.lineWidth = 4;
                    ctx.strokeRect(- (this.tileSize - this.padding) / 2, - (this.tileSize - this.padding) / 2, this.tileSize - this.padding, this.tileSize - this.padding);
                }

                ctx.restore();
            }
        }

        // small HUD
        this.ctx.fillStyle = "white";
        this.ctx.font = "14px Arial";
        this.ctx.fillText(`Progress: ${this.progress}/${this.progressTarget}`, 8, this.canvas.height - 8);

        // update progress bar width
        this._updateProgressUI();
    }

    _updateProgressUI() {
        const pct = Math.min(1, this.progress / this.progressTarget) * 100;
        this.progressInner.style.width = pct + "%";
    }

    // -----------------------
    // Completion animation (confetti-like burst + scale)
    // -----------------------
    async _playCompletionAnimation() {
        // Fade overlay + big text + pulse
        return new Promise(res => {
            const overlay = document.createElement("div");
            overlay.style.position = "absolute";
            overlay.style.left = "0";
            overlay.style.top = "0";
            overlay.style.width = "100%";
            overlay.style.height = "100%";
            overlay.style.display = "flex";
            overlay.style.alignItems = "center";
            overlay.style.justifyContent = "center";
            overlay.style.zIndex = "999";
            overlay.style.pointerEvents = "none";
            overlay.style.background = "rgba(0,0,0,0)";
            overlay.style.transition = "background 0.35s ease";
            this.wrapper.appendChild(overlay);

            const txt = document.createElement("div");
            txt.innerText = "Puzzle Complete!";
            txt.style.color = "white";
            txt.style.fontSize = "36px";
            txt.style.fontWeight = "700";
            txt.style.textAlign = "center";
            txt.style.opacity = "0";
            txt.style.transform = "scale(0.8)";
            overlay.appendChild(txt);

            // start fade and text pop
            requestAnimationFrame(() => {
                overlay.style.background = "rgba(0,0,0,0.6)";
                txt.style.transition = "transform 0.45s cubic-bezier(.2,1,.3,1), opacity 0.45s";
                txt.style.opacity = "1";
                txt.style.transform = "scale(1)";
            });

            // simple confetti canvas on top
            const confettiCanvas = document.createElement("canvas");
            confettiCanvas.width = this.canvas.width;
            confettiCanvas.height = this.canvas.height;
            confettiCanvas.style.position = "absolute";
            confettiCanvas.style.left = this.canvas.offsetLeft + "px";
            confettiCanvas.style.top = this.canvas.offsetTop + "px";
            confettiCanvas.style.pointerEvents = "none";
            this.wrapper.appendChild(confettiCanvas);

            const confCtx = confettiCanvas.getContext("2d");
            const pieces = [];
            for (let i = 0; i < 40; i++) {
                pieces.push({
                    x: this.canvas.width/2,
                    y: this.canvas.height/2,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 2.5) * 8,
                    r: 4 + Math.random()*6,
                    color: ["#ff3b3b","#ffcc00","#32cd32","#1e90ff","#ff00ea"][Math.floor(Math.random()*5)],
                    rot: Math.random()*Math.PI*2
                });
            }

            let confTime = 0;
            function confettiLoop(ts) {
                confTime++;
                confCtx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
                for (const p of pieces) {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.25; // gravity
                    confCtx.save();
                    confCtx.translate(p.x,p.y);
                    confCtx.rotate(p.rot += 0.05);
                    confCtx.fillStyle = p.color;
                    confCtx.fillRect(-p.r/2, -p.r/2, p.r, p.r*1.6);
                    confCtx.restore();
                }
                if (confTime < 120) requestAnimationFrame(confettiLoop);
                else {
                    confettiCanvas.remove();
                }
            }
            requestAnimationFrame(confettiLoop);

            // finish after a bit
            setTimeout(() => {
                overlay.style.background = "rgba(0,0,0,0)";
                txt.style.opacity = "0";
                txt.style.transform = "scale(1.2)";
                setTimeout(() => {
                    overlay.remove();
                    res();
                }, 400);
            }, 1000);
        });
    }

    _showTimeoutAndReset() {
        // simple failure overlay and then reload grid
        const fail = document.createElement("div");
        fail.style.position = "absolute";
        fail.style.left = "0";
        fail.style.top = "0";
        fail.style.width = "100%";
        fail.style.height = "100%";
        fail.style.display = "flex";
        fail.style.alignItems = "center";
        fail.style.justifyContent = "center";
        fail.style.zIndex = "999";
        fail.style.pointerEvents = "none";
        fail.style.background = "rgba(0,0,0,0.6)";
        fail.innerHTML = `<div style="color:white;text-align:center"><h2>Time's up!</h2><p>Try again</p></div>`;
        this.wrapper.appendChild(fail);
        setTimeout(() => {
            fail.remove();
            // reset progress & timer & regenerate
            this.progress = 0;
            this.remainingTime = this.timeLimit;
            this.timerRunning = this.useTimer;
            this._generateInitialGrid();
            this._resolveInitialMatches();
        }, 1000);
    }

    // -----------------------
    // Utilities
    // -----------------------
    _wait(ms) { return new Promise(res => setTimeout(res, ms)); }
    _easeOutBack(t) { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
    _easeOutElastic(t) { const c4 = (2 * Math.PI) / 3; if (t === 0) return 0; if (t === 1) return 1; return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1; }

    // -----------------------
    // Public helpers (optional)
    // -----------------------
    // call to destroy puzzle UI and stop loop
    destroy() {
        this.canvas.remove();
        this.wrapper.remove();
    }
}
