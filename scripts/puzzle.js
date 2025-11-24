// scripts/puzzle.js
// Candy-Crush style puzzle mini-game

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
        this.isRunning = false; // Flag to control the game loop

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
        this.blockInput = true; // Block input until grid is ready
        this._lastFrame = performance.now();

        this._createUIElements();

        this._loadAllImages().then(() => {
            this._resizeCanvas();
            this._generateInitialGrid();
            // Ensure no immediate matches exist on start
            this._resolveInitialMatches().then(() => {
                this._attachInput();
                this.blockInput = false; // Enable input after grid is stable
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
        // --- Wrapper Creation (for positioning UI relative to canvas) ---
        this.wrapper = document.createElement("div");
        this.wrapper.className = "wrapper"; // Use CSS class for styling
        this.wrapper.style.position = "relative";
        this.wrapper.style.width = "max-content";
        this.wrapper.style.margin = "20px auto";
        
        // Find the canvas's current parent or use body
        const targetParent = this.canvas.parentNode || document.body;
        targetParent.insertBefore(this.wrapper, this.canvas);
        this.wrapper.appendChild(this.canvas);

        // --- Progress Bar ---
        this.progressBar = document.createElement("div");
        this.progressBar.className = "progress-bar"; 
        this.progressInner = document.createElement("div");
        this.progressInner.className = "progress-inner";
        this.progressBar.appendChild(this.progressInner);
        this.wrapper.appendChild(this.progressBar);

        // --- Timer Text ---
        this.timerText = document.createElement("div");
        this.timerText.className = "timer-text";
        this.timerText.innerText = `Time: ${this.timeLimit}s`;
        this.wrapper.appendChild(this.timerText);

        // --- Completion Overlay ---
        this.completionOverlay = document.createElement("div");
        this.completionOverlay.className = "completion-overlay";
        this.completionOverlay.style.background = "rgba(0,0,0,0.0)";
        this.completionOverlay.style.pointerEvents = "none";
        this.wrapper.appendChild(this.completionOverlay);
        
        // Apply inline styles if needed, but primarily rely on style.css
        // This keeps the HTML structure minimal and clean.
    }

    _loadAllImages() {
        const load = (src) => new Promise((res, rej) => {
            const img = new Image();
            img.onload = () => res(img);
            img.onerror = () => { console.error(`Failed to load image: ${src}`); rej(); };
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
                // Initial placement should avoid forming immediate matches (handled by _resolveInitialMatches, but better to prevent)
                let type;
                do {
                    type = this._randomTileType();
                } while (
                    (c >= 2 && this.grid[r][c-1]?.typeName === type.name && this.grid[r][c-2]?.typeName === type.name) ||
                    (r >= 2 && this.grid[r-1][c]?.typeName === type.name && this.grid[r-2][c]?.typeName === type.name)
                );
                this.grid[r][c] = this._createTile(r, c, type);
            }
        }
    }

    _createTile(r, c, type) {
        return {
            r, c,
            typeName: type.name,
            img: type.img,
            special: "normal",
            yOffset: 0, // Used for gravity animation
            xOffset: 0, // Used for swap animation
            removing: false
        };
    }

    _randomTileType() {
        return this.tileTypes[Math.floor(Math.random() * this.tileTypes.length)];
    }

    _attachInput() {
        // Use a single event listener for pointer down/up/move for both mouse and touch
        this.canvas.addEventListener("pointerdown", this._handlePointerDown);
        this.canvas.addEventListener("pointerup", this._handlePointerUp);
        // this.canvas.addEventListener("pointermove", this._handlePointerMove); // Optional for drag-and-swipe
    }

    // Use arrow functions for auto-binding 'this'
    _handlePointerDown = (e) => {
        e.preventDefault();
        if (this.blockInput) return;
        const pos = this._pointerToGrid(e);
        if (!pos) return;
        this.pointerDown = pos;
    }

    _handlePointerUp = (e) => {
        e.preventDefault();
        if (this.blockInput || !this.pointerDown) {
            this.pointerDown = null;
            return;
        }
        const pos = this._pointerToGrid(e);
        if (!pos) {
            this.pointerDown = null;
            return;
        }

        const a = this.pointerDown;
        const b = pos;
        this.pointerDown = null;
        
        // If the click is on the same tile, select/deselect
        if (a.r === b.r && a.c === b.c) {
            if (this.selected && this._isAdjacent(this.selected, a)) {
                this._attemptSwap(this.selected.r, this.selected.c, a.r, a.c);
                this.selected = null;
            } else {
                this.selected = a;
            }
            return;
        }

        // Check if the move is an adjacent swipe
        if (this._isAdjacent(a, b)) {
            this._attemptSwap(a.r, a.c, b.r, b.c);
        }
    }

    _isAdjacent(posA, posB) {
        return Math.abs(posA.r - posB.r) + Math.abs(posA.c - posB.c) === 1;
    }

    _pointerToGrid(e) {
        const rect = this.canvas.getBoundingClientRect();
        // Use clientX/Y directly from the event object for simplicity
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const c = Math.floor(x / this.tileSize);
        const r = Math.floor(y / this.tileSize);
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return null;
        return { r, c };
    }

    _attemptSwap(r1, c1, r2, c2) {
        if (this.blockInput) return;
        this.blockInput = true;
        
        // Prepare animation data on the tiles
        const tileA = this.grid[r1][c1];
        const tileB = this.grid[r2][c2];
        if (!tileA || !tileB) { this.blockInput = false; return; }

        // Start animation before swapping data
        const swapAnim = { type: "swap", a: tileA, b: tileB, t: 0, duration: 200, reverse: false };
        this.animations.push(swapAnim);

        // Perform the swap in the grid data
        this._swapTiles(r1, c1, r2, c2);

        // Check for matches AFTER the swap animation finishes
        setTimeout(() => {
            const matches = this._findMatches();
            if (matches.length === 0) {
                // No match, swap back
                this._swapTiles(r1, c1, r2, c2);
                this.animations.push({ type: "swap", a: tileA, b: tileB, t: 0, duration: 200, reverse: true });
                setTimeout(() => { this.blockInput = false; }, 220);
            } else {
                // Match found, resolve chain
                this._resolveMatchesChain().then(() => { this.blockInput = false; });
            }
        }, 220); // Wait slightly longer than the swap duration
    }

    _swapTiles(r1, c1, r2, c2) {
        const tmp = this.grid[r1][c1];
        this.grid[r1][c1] = this.grid[r2][c2];
        this.grid[r2][c2] = tmp;
        // Update tile's recorded position (r, c)
        if (this.grid[r1][c1]) { this.grid[r1][c1].r = r1; this.grid[r1][c1].c = c1; }
        if (this.grid[r2][c2]) { this.grid[r2][c2].r = r2; this.grid[r2][c2].c = c2; }
    }

    _findMatches() {
        const matched = new Set();
        // Check Horizontal Matches
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
        // Check Vertical Matches
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
            
            // 1. Mark for removal and start pop animation
            matches.forEach(m => {
                const tile = this.grid[m.r][m.c];
                if (tile) {
                    tile.removing = true;
                    this.animations.push({ type: "pop", target: tile, t: 0, duration: 150 });
                }
            });
            await this._wait(160); // Wait for the pop animation

            // 2. Remove tiles
            matches.forEach(m => this.grid[m.r][m.c] = null);
            
            // 3. Update progress
            this.progress += matches.length;
            this._updateProgressUI();
            
            // 4. Apply gravity and refill, starting movement animation
            this._applyGravityAndRefill();
            await this._wait(250); // Wait for gravity to settle
        }
        // Check completion criteria
        if(this.progress>=this.progressTarget){ 
            this.timerRunning = false;
            await this._playCompletionAnimation(); 
            this.destroy(); // Clean up puzzle UI/canvas
            this.onComplete && this.onComplete(); 
        }
        // Check for no possible moves (optional: implement hint/shuffle)
    }

    _applyGravityAndRefill() {
        for(let c=0;c<this.cols;c++){
            let write=this.rows-1;
            // Handle gravity: move non-null tiles down
            for(let r=this.rows-1;r>=0;r--){
                const tile = this.grid[r][c];
                if(tile){
                    if(write!==r){
                        // Apply animation offset for gravity
                        tile.yOffset = (r - write) * this.tileSize; 
                        
                        this.grid[write][c]=tile; 
                        this.grid[write][c].r=write; 
                        this.grid[r][c]=null;
                        // Start gravity animation
                        this.animations.push({ type: "gravity", target: tile, t: 0, duration: 200 });
                    }
                    write--;
                }
            }
            // Refill: create new tiles above the top row
            for(let r=write;r>=0;r--){ 
                const newTile = this._createTile(r, c, this._randomTileType());
                newTile.yOffset = (r - write - 1) * this.tileSize; // Start off-screen above
                this.grid[r][c]=newTile;
                // Start refill animation
                this.animations.push({ type: "gravity", target: newTile, t: 0, duration: 200 });
            }
        }
    }

    async _resolveInitialMatches() { 
        while(this._findMatches().length>0){ 
            const matches=this._findMatches(); 
            matches.forEach(m=>this.grid[m.r][m.c]=null); 
            this._applyGravityAndRefill(); 
            await this._wait(100); // Faster wait for initial stability
        } 
    }

    _loop() {
        if (!this.isRunning) return; // Check flag to stop loop

        const now=performance.now();
        const dt=(now-this._lastFrame)/1000||0; // Delta time in seconds
        this._lastFrame=now;

        // --- Timer Update ---
        if(this.timerRunning){ 
            this.remainingTime-=dt; 
            if(this.remainingTime<=0){
                this.remainingTime=0; 
                this.timerRunning=false; 
                this.blockInput = true;
                if(this.progress>=this.progressTarget){
                    this._playCompletionAnimation().then(() => { this.destroy(); this.onComplete && this.onComplete(); });
                } else {
                    this._showTimeoutAndReset();
                }
            } 
            this.timerText.innerText=`Time: ${Math.ceil(this.remainingTime)}s`; 
        }

        this._updateAnimations(dt);
        this._draw();
        requestAnimationFrame(this._loop.bind(this));
    }
    
    // Public method to start the loop after loading
    start() {
        this.isRunning = true;
        this._loop();
    }

    _updateAnimations(dt){ 
        const ms = dt * 1000;
        this.animations = this.animations.filter(anim => {
            anim.t += ms;
            const progress = Math.min(1, anim.t / anim.duration);
            
            if (anim.type === "gravity") {
                const target = anim.target;
                const distance = (target.r - target.r) * this.tileSize; // Should use the initial offset value but we simplify
                
                // Ease-out effect for gravity
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                target.yOffset = target.yOffset * (1 - easeProgress);

            } else if (anim.type === "swap") {
                // The actual tile position in the grid has swapped, the animation moves the visual elements
                const p = anim.reverse ? 1 - progress : progress; 
                const tileA = this.grid[anim.a.r][anim.a.c]; // Tile A is now at B's original spot
                const tileB = this.grid[anim.b.r][anim.b.c]; // Tile B is now at A's original spot
                
                // Swap uses temporary offsets which must be applied during drawing.
                // We'll use the tile's xOffset/yOffset property for this
                // NOTE: This complex logic is easier to handle by drawing the tiles 
                // based on their original/target positions during the animation. 
                // For simplicity here, we only use the animation object for timing.
                
            } else if (anim.type === "pop") {
                // Scale animation
                anim.target.pop = Math.sin(progress * Math.PI) * 0.2; // Quick scale up then down
            }
            
            return anim.t < anim.duration;
        });
    }

    _draw(){ 
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "#3e4043"; // Grid background color
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid lines (optional)
        // Draw tiles
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const tile = this.grid[r][c];
                if (!tile || tile.removing) continue;

                let x = c * this.tileSize;
                let y = r * this.tileSize - tile.yOffset; // Apply gravity offset

                // Check for swap animation (more complex, skipped for brevity, relies on animation object)
                
                // Apply 'pop' scale
                const scale = 1 + tile.pop;
                const size = this.tileSize * scale - 2 * this.padding;
                const offset = (this.tileSize - size) / 2;

                this.ctx.save();
                this.ctx.translate(x + offset, y + offset);
                
                if (tile.img) {
                    this.ctx.drawImage(tile.img, 
                        0, 0, 
                        size, size
                    );
                } else {
                    // Fallback
                    this.ctx.fillStyle = "grey";
                    this.ctx.fillRect(0, 0, size, size);
                }
                
                this.ctx.restore();
            }
        }
        
        // Draw Selection Box
        if (this.selected) {
            this.ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            this.ctx.lineWidth = 4;
            this.ctx.strokeRect(
                this.selected.c * this.tileSize + 2,
                this.selected.r * this.tileSize + 2,
                this.tileSize - 4,
                this.tileSize - 4
            );
        }
    }
    
    _updateProgressUI(){ 
        const pct=Math.min(1,this.progress/this.progressTarget)*100; 
        this.progressInner.style.width=pct+"%"; 
        // Optional: Change color when near target
    }
    
    _wait(ms){ 
        return new Promise(res=>setTimeout(res,ms)); 
    }
    
    async _playCompletionAnimation(){ 
        this.blockInput = true;
        this.completionOverlay.style.pointerEvents = 'auto';
        this.completionOverlay.style.background = "rgba(0, 200, 0, 0.4)";
        this.completionOverlay.innerHTML = "<h2 style='color:white;text-shadow: 2px 2px 4px #000;'>SUCCESS! STARTING RACE...</h2>";
        await this._wait(1500);
        this.completionOverlay.style.background = "rgba(0,0,0,0.0)";
        this.completionOverlay.style.pointerEvents = 'none';
    }
    
    async _showTimeoutAndReset(){ 
        this.blockInput = true;
        this.completionOverlay.style.pointerEvents = 'auto';
        this.completionOverlay.style.background = "rgba(200, 0, 0, 0.6)";
        this.completionOverlay.innerHTML = "<h2 style='color:white;text-shadow: 2px 2px 4px #000;'>TIME OUT!</h2>";
        await this._wait(2000);
        
        // Reset game state for another attempt (or redirect to fail screen)
        this.progress = 0;
        this.remainingTime = this.timeLimit;
        this._updateProgressUI();
        this._generateInitialGrid();
        this._resolveInitialMatches();
        
        this.completionOverlay.style.background = "rgba(0,0,0,0.0)";
        this.completionOverlay.style.pointerEvents = 'none';
        this.timerRunning = true;
        this.blockInput = false;
    }

    // Public cleanup method
    destroy(){ 
        this.isRunning = false; // Stop the loop
        this.canvas.removeEventListener("pointerdown", this._handlePointerDown);
        this.canvas.removeEventListener("pointerup", this._handlePointerUp);
        if (this.canvas.parentNode === this.wrapper) {
            this.wrapper.remove();
        } else {
            // If wrapper was not attached to document.body initially, handle removal safely
            this.canvas.remove(); 
            this.wrapper.remove();
        }
    }
}
