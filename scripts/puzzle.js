// scripts/puzzle.js
// Candy-Crush style puzzle mini-game
// Usage:
// import Puzzle from "./scripts/puzzle.js";
// const puzzle = new Puzzle({ canvas: myCanvas, rows:7, cols:7, tileSize:64, timeLimitSec:45, progressTarget:6 }, () => { 
//     /* onComplete -> show country menu */ 
// });

export default class Puzzle {
    constructor(options = {}, onComplete = () => {}) {
        this.canvas = options.canvas || this._createCanvas();
        this.ctx = this.canvas.getContext("2d");
        this.rows = options.rows ?? 7;
        this.cols = options.cols ?? 7;
        this.tileSize = options.tileSize ?? 64;
        this.padding = Math.max(6, Math.round(this.tileSize * 0.08));
        this.timeLimit = options.timeLimitSec ?? 45;
        this.useTimer = options.useTimer ?? true;
        this.progressTarget = options.progressTarget ?? 6;
        this.onComplete = onComplete;

        this.candyPaths = [
            { src: "assets/candy_red.png", name: "red" },
            { src: "assets/candy_yellow.png", name: "yellow" },
            { src: "assets/candy_green.png", name: "green" },
            { src: "assets/candy_purple.png", name: "purple" },
            { src: "assets/candy_blue.png", name: "blue" }
        ];

        this.tileTypes = [];
        this.grid = [];
        this.animations = [];
        this.selected = null;
        this.pointerDown = null;
        this.progress = 0;
        this.remainingTime = this.timeLimit;
        this.timerRunning = this.useTimer && this.timeLimit > 0;
        this.blockInput = false;
        this._lastFrame = performance.now();

        this._createUIElements();

        this._loadAllImages().then(() => {
            this._resizeCanvas();
            this._generateInitialGrid();
            this._resolveInitialMatches().then(() => {
                this._attachInput();
                this._loop();
            });
        });
    }

    _createCanvas() {
        const canvas = document.createElement("canvas");
        canvas.style.display = "block";
        canvas.style.margin = "20px auto";
        document.body.appendChild(canvas);
        return canvas;
    }

    _createUIElements() {
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

        this.timerText = document.createElement("div");
        this.timerText.style.position = "absolute";
        this.timerText.style.right = "-8px";
        this.timerText.style.top = "-56px";
        this.timerText.style.color = "white";
        this.timerText.style.fontFamily = "Arial";
        this.timerText.style.fontSize = "14px";
        this.wrapper.appendChild(this.timerText);

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
    }

    _loadAllImages() {
        const load = (src) => new Promise((res, rej) => {
            const img = new Image();
            img.onload = () => res(img);
            img.onerror = rej;
            img.src = src;
        });
        return Promise.all(this.candyPaths.map(p => load(p.src).then(img => {
            this.tileTypes.push({ name: p.name, img });
        })));
    }

    _resizeCanvas() {
        this.canvas.width = this.cols * this.tileSize;
        this.canvas.height = this.rows * this.tileSize;
        this.wrapper.style.width = this.canvas.width + "px";
    }

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
            special: "normal",
            yOffset: 0,
            pop: 0,
            removing: false
        };
    }

    _randomTileType() {
        return this.tileTypes[Math.floor(Math.random() * this.tileTypes.length)];
    }

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
            if (!pos || !this.pointerDown) { this.pointerDown = null; return; }
            const a = this.pointerDown, b = pos;
            this.pointerDown = null;
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

    _attemptSwap(r1, c1, r2, c2) {
        if (this.blockInput) return;
        this.blockInput = true;
        this._swapTiles(r1, c1, r2, c2);
        const swapAnim = { type: "swap", a: { r: r1, c: c1 }, b: { r: r2, c: c2 }, t: 0, duration: 180 };
        this.animations.push(swapAnim);

        setTimeout(() => {
            const matches = this._findMatches();
            if (matches.length === 0) {
                this._swapTiles(r1, c1, r2, c2);
                this.animations.push({ type: "swap", a: { r: r1, c: c1 }, b: { r: r2, c: c2 }, t: 0, duration: 180, reverse: true });
                setTimeout(() => { this.blockInput = false; }, 210);
            } else {
                this._resolveMatchesChain().then(() => { this.blockInput = false; });
            }
        }, 200);
    }

    _swapTiles(r1, c1, r2, c2) {
        const tmp = this.grid[r1][c1];
        this.grid[r1][c1] = this.grid[r2][c2];
        this.grid[r2][c2] = tmp;
        if (this.grid[r1][c1]) { this.grid[r1][c1].r = r1; this.grid[r1][c1].c = c1; }
        if (this.grid[r2][c2]) { this.grid[r2][c2].r = r2; this.grid[r2][c2].c = c2; }
    }

    _findMatches() {
        const matched = new Set();
        for (let r = 0; r < this.rows; r++) {
            let streak = 1;
            for (let c = 1; c < this.cols; c++) {
                const a = this.grid[r][c], b = this.grid[r][c-1];
                if (!a || !b) { streak = 1; continue; }
                if (a.typeName === b.typeName) streak++;
                else { if (streak >= 3) for (let k=c-streak;k<c;k++) matched.add(`${r},${k}`); streak=1; }
            }
            if (streak >= 3) for (let k=this.cols-streak;k<this.cols;k++) matched.add(`${r},${k}`);
        }
        for (let c = 0; c < this.cols; c++) {
            let streak = 1;
            for (let r = 1; r < this.rows; r++) {
                const a=this.grid[r][c],b=this.grid[r-1][c];
                if(!a||!b){streak=1;continue;}
                if(a.typeName===b.typeName) streak++;
                else { if(streak>=3) for(let k=r-streak;k<r;k++) matched.add(`${k},${c}`); streak=1; }
            }
            if(streak>=3) for(let k=this.rows-streak;k<this.rows;k++) matched.add(`${k},${c}`);
        }
        return Array.from(matched).map(s=>{const [r,c]=s.split(",").map(Number);return {r,c};});
    }

    async _resolveMatchesChain() {
        while(true){
            const matches=this._findMatches();
            if(matches.length===0) break;
            matches.forEach(m=>this.grid[m.r][m.c]=null);
            this.progress+=matches.length;
            this._updateProgressUI();
            this._applyGravityAndRefill();
            await this._wait(220);
        }
        if(this.progress>=this.progressTarget){ await this._playCompletionAnimation(); this.onComplete&&this.onComplete(); }
    }

    _applyGravityAndRefill() {
        for(let c=0;c<this.cols;c++){
            let write=this.rows-1;
            for(let r=this.rows-1;r>=0;r--){
                if(this.grid[r][c]){
                    if(write!==r){this.grid[write][c]=this.grid[r][c]; this.grid[write][c].r=write; this.grid[r][c]=null;}
                    write--;
                }
            }
            for(let r=write;r>=0;r--){ this.grid[r][c]=this._createTile(r,c,this._randomTileType()); }
        }
    }

    async _resolveInitialMatches() { while(this._findMatches().length>0){ const matches=this._findMatches(); matches.forEach(m=>this.grid[m.r][m.c]=null); this._applyGravityAndRefill(); await this._wait(60); } }

    _loop() {
        const now=performance.now();
        const dt=(now-this._lastFrame)/1000||0;
        this._lastFrame=now;

        if(this.timerRunning){ this.remainingTime-=dt; if(this.remainingTime<=0){this.remainingTime=0; this.timerRunning=false; if(this.progress>=this.progressTarget){this._playCompletionAnimation().then(()=>this.onComplete&&this.onComplete());}else{this._showTimeoutAndReset();}} this.timerText.innerText=`Time: ${Math.ceil(this.remainingTime)}s`; }

        this._updateAnimations(dt);
        this._draw();
        requestAnimationFrame(this._loop.bind(this));
    }

    _updateAnimations(dt){ /* simplified for brevity, same as previous */ }
    _draw(){ /* simplified for brevity, same as previous */ }
    _updateProgressUI(){ const pct=Math.min(1,this.progress/this.progressTarget)*100; this.progressInner.style.width=pct+"%"; }
    _wait(ms){ return new Promise(res=>setTimeout(res,ms)); }
    _playCompletionAnimation(){ /* simplified for brevity, same as previous */ }
    _showTimeoutAndReset(){ /* simplified for brevity, same as previous */ }

    destroy(){ this.canvas.remove(); this.wrapper.remove(); }
}
