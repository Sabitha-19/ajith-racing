// scripts/RacerGame.js
// Full Advanced RacerGame controller for 2D lane-based racing (canvas).
//
// Dependencies (expected to exist under /scripts):
// - Racer.js      (lane-based racer with .position, .lane, update(delta, controls), draw(ctx,track), applyPowerUp(type), crash())
// - Track.js      (has project(position, lane) => {x,y,scale} and setEnvironment(countryData))
// - Camera.js     (constructed with racer: new Camera(racer) and .update(delta))
// - TouchControls.js (class returning control flags: left/right/down/nitro; has enableKeyboard() optionally)
// - EnemyRacer.js (enemy class compatible with track.project: constructor(lane, startPosition) or similar)
// - PowerUp.js    (constructor(image, lane, position, type) with update(delta,track), draw(ctx), checkCollision(player))
// - UIManager.js  (ui = new UIManager(); ui.show/hideCountryMenu(), ui.showHUD(), ui.showDebugUI(), ui.debugUI element contains #btnSpawnEnemy #btnResetRace)
//
// Expects `countries.json` at project root.

export default class RacerGame {
    /**
     * canvasId: id string for the canvas element used for rendering (example "game-canvas")
     * ui: instance of UIManager (optional) — if not supplied, UI queries fall back to DOM
     * options: { debug: boolean }
     */
    constructor(canvasId = "game-canvas", ui = null, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            // create canvas fallback
            this.canvas = document.createElement("canvas");
            this.canvas.id = canvasId;
            document.getElementById("game-container")?.appendChild(this.canvas);
        }
        this.ctx = this.canvas.getContext("2d");

        // size canvas
        this._resizeCanvas();
        window.addEventListener("resize", () => this._resizeCanvas());

        // systems & assets
        this.ui = ui;
        this.options = options || {};
        this.debug = !!this.options.debug;

        this.track = null;        // set after loadTrack()
        this.player = null;       // Racer instance
        this.camera = null;       // Camera instance
        this.controls = null;     // TouchControls instance

        this.enemies = [];        // EnemyRacer instances
        this.powerUps = [];       // PowerUp instances

        this.countryData = null;  // loaded country config
        this.countries = null;    // full countries.json content (loaded once)

        // state
        this.running = false;
        this.lastTime = 0;
        this.spawnTimer = 0;
        this.enemyCountTarget = 3;

        // audio (optional)
        this.sounds = {};

        // pre-load a few images used for powerups and cars
        this.images = {};
        this._preloadImages();

        // Create controls
        this.controls = new (this._getModule("TouchControls"))();
        // enable keyboard fallback for testing
        if (!this.controls.isMobile) this.controls.enableKeyboard?.();

        // Debug toggle
        window.addEventListener("keydown", (e) => {
            if (e.key === "F1") {
                this.debug = !this.debug;
                this._applyDebugVisibility();
                e.preventDefault();
            }
        });

        // wire UI debug buttons if UI exists or DOM elements exist
        this._wireDebugButtons();

        // helpful defaults
        this.pixelRatio = window.devicePixelRatio || 1;
    }

    // ----------------------------
    // Helpers to require modules that may be exported default or common names
    // ----------------------------
    _getModule(name) {
        // try global import via dynamic import map if needed
        // In our setup these classes are loaded as separate files; here code expects them to be available via import in other modules.
        // We'll do a simple dynamic import for the script name.
        // NOTE: the calling code already imported Racer class separately; but for safety we attempt to import modules on demand.
        // This function returns the constructor (class) synchronously only if it exists on window. Otherwise the code that uses it
        // will have also imported the required classes earlier. So this is a safe fallback.
        if (window[name]) return window[name];
        // fallback: return a dummy no-op class (should not happen in normal setup)
        return class {
            constructor() { console.warn(`${name} missing`); }
        };
    }

    _preloadImages() {
        const load = (src) => {
            const img = new Image();
            img.src = src;
            return img;
        };

        // expected asset names (you can add more in assets/)
        this.images.car = load("assets/car.png");
        this.images.enemy = load("assets/enemy.png");
        this.images.coin = load("assets/coin.png");
        this.images.nitro = load("assets/nitro.png");
        this.images.health = load("assets/health.png");
        this.images.road = load("assets/road.png");
    }

    _resizeCanvas() {
        const w = window.innerWidth, h = window.innerHeight;
        this.canvas.width = Math.floor(w * (window.devicePixelRatio || 1));
        this.canvas.height = Math.floor(h * (window.devicePixelRatio || 1));
        this.canvas.style.width = `${w}px`;
        this.canvas.style.height = `${h}px`;
        if (this.camera && typeof this.camera.setScreenSize === "function") {
            this.camera.setScreenSize(w, h);
        }
    }

    _applyDebugVisibility() {
        if (!this.ui) {
            const panel = document.getElementById("debug-panel");
            if (panel) panel.style.display = this.debug ? "block" : "none";
        } else {
            if (this.debug) this.ui.showDebugUI?.(); else this.ui.hideDebugUI?.();
        }
    }

    _wireDebugButtons() {
        // If UIManager created buttons with IDs btnSpawnEnemy / btnResetRace or legacy ids, wire them
        // Also wire fallback DOM buttons with ids spawn-enemy and reset-race
        const spawnBtn = document.getElementById("btnSpawnEnemy") || document.getElementById("spawn-enemy");
        const resetBtn = document.getElementById("btnResetRace") || document.getElementById("reset-race");

        if (spawnBtn) spawnBtn.addEventListener("click", () => this.spawnEnemy());
        if (resetBtn) resetBtn.addEventListener("click", () => this.resetRace());
    }

    // ----------------------------
    // Load countries.json (once) and then set up track for a chosen country
    // ----------------------------
    async _ensureCountriesLoaded() {
        if (this.countries) return this.countries;
        try {
            const res = await fetch("countries.json");
            if (!res.ok) throw new Error("countries.json not found");
            this.countries = await res.json();
            return this.countries;
        } catch (err) {
            console.warn("Failed to load countries.json:", err);
            this.countries = {};
            return this.countries;
        }
    }

    /**
     * loadTrack(countryKey)
     * - countryKey: string like 'india' or 'usa'
     */
    async loadTrack(countryKey) {
        const countries = await this._ensureCountriesLoaded();
        const data = countries[countryKey];
        if (!data) {
            console.warn("Country not found:", countryKey);
            this.countryData = null;
        } else {
            this.countryData = data;
        }

        // create Track instance (expecting constructor: new Track(canvas) or new Track(width,height))
        // We will attempt a few common constructor signatures.
        try {
            // prefer passing canvas (our Track.js expects canvas)
            this.track = new (await import("./Track.js")).default(this.canvas);
        } catch (e) {
            // fallback: new Track(width,height)
            try {
                this.track = new (await import("./Track.js")).default(this.canvas.width, this.canvas.height);
            } catch (err) {
                console.error("Failed to construct Track:", err);
                this.track = null;
            }
        }

        // apply environment data to track if setEnvironment exists
        if (this.track && this.countryData && typeof this.track.setEnvironment === "function") {
            this.track.setEnvironment(this.countryData);
        } else if (this.track && this.countryData) {
            // if track has road sprite property, attempt to set it
            if (this.track.roadSprite && this.countryData.road) {
                const img = new Image();
                img.src = this.countryData.road;
                this.track.roadSprite = img;
            }
        }

        // Create player (Racer)
        const RacerClass = (await import("./Racer.js")).default;
        this.player = new RacerClass(this.images.car);
        // ensure starting position consistent with country data if provided
        if (this.countryData && this.countryData.start) {
            // Many Racer implementations expect lane & position; ours uses lane & position
            // if start contains x/y, guess lane/position: here we set player.position to -start.y to put ahead
            if (typeof this.player.position !== "undefined") {
                // interpret start.y as negative forward offset (this is a heuristic)
                this.player.position = Math.abs(this.countryData.start.y) || 0;
            }
            if (typeof this.player.lane !== "undefined") {
                // set lane from start.x (normalize)
                const sx = this.countryData.start.x || 0;
                this.player.lane = Math.max(-1, Math.min(1, Math.round(sx / 60)));
                this.player.targetLane = this.player.lane;
            }
        }

        // Camera
        const CameraClass = (await import("./Camera.js")).default;
        try {
            this.camera = new CameraClass(this.player, window.innerWidth, window.innerHeight);
        } catch (err) {
            // older Camera constructors might take just player
            try { this.camera = new CameraClass(this.player); } catch(e){ this.camera = null; }
        }

        // Controls
        const ControlsClass = (await import("./TouchControls.js")).default;
        this.controls = new ControlsClass();
        if (!this.controls.isMobile) this.controls.enableKeyboard?.();

        // Prepare enemies & powerups empty arrays
        this.enemies = [];
        this.powerUps = [];

        // Pre-populate some enemies and power-ups depending on difficulty
        const difficulty = (this.countryData && this.countryData.difficulty) || 1;
        this.enemyCountTarget = 2 + difficulty; // more enemies on higher difficulty

        // spawn initial enemies a bit ahead of player
        for (let i = 0; i < this.enemyCountTarget; i++) {
            this.spawnEnemy(this.player.position + 400 + i * 250);
        }

        // spawn initial powerups along track
        this._spawnInitialPowerUps();

        // if UI available, show HUD
        this.ui?.showHUD();
    }

    _spawnInitialPowerUps() {
        const PowerUpClass = (window.PowerUp || null) ? window.PowerUp : null;
        // we expect PowerUp class to be importable via module file
        // but we already have images loaded. We'll import the module and create instances.
        import("./PowerUp.js").then(mod => {
            const PowerUpCtor = mod.default;
            // spawn coins/nitro/health along the next kilometers
            for (let i = 1; i <= 6; i++) {
                const lane = [-1,0,1][Math.floor(Math.random()*3)];
                const pos = (this.player.position || 0) + i * 450 + Math.random()*200;
                const type = i % 3 === 0 ? "nitro" : (i % 5 === 0 ? "health" : "coin");
                const img = type === "coin" ? this.images.coin : (type === "nitro" ? this.images.nitro : this.images.health);
                const p = new PowerUpCtor(img, lane, pos, type);
                this.powerUps.push(p);
            }
        }).catch(err => {
            console.warn("PowerUp module import failed:", err);
        });
    }

    // ----------------------------
    // Game controls
    // ----------------------------
    start() {
        if (!this.track || !this.player) {
            console.warn("RacerGame: track or player not ready. Call loadTrack(country) first.");
            return;
        }
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this._loop.bind(this));
    }

    stop() {
        this.running = false;
    }

    resetRace() {
        // Reset player and arrays
        if (this.player) {
            this.player.position = 0;
            this.player.lane = 0;
            this.player.targetLane = 0;
            this.player.speed = 0;
        }
        this.enemies = [];
        this.powerUps = [];
        this._spawnInitialPowerUps();
        for (let i = 0; i < this.enemyCountTarget; i++) {
            this.spawnEnemy(this.player.position + 300 + i * 300);
        }
    }

    // spawnEnemy(optionalPosition)
    // Returns the created enemy instance
    spawnEnemy(optionalPosition = null) {
        // Import EnemyRacer and create with lane + position style (works with EnemyRacer version that accepts lane & position)
        return import("./EnemyRacer.js").then(mod => {
            const EnemyCtor = mod.default;
            // choose lane and position
            const lane = [-1,0,1][Math.floor(Math.random()*3)];
            const basePos = (this.player?.position || 0);
            const pos = optionalPosition !== null ? optionalPosition : (basePos + 400 + Math.random() * 1200);
            const e = new EnemyCtor(lane, pos);
            this.enemies.push(e);
            return e;
        }).catch(err => {
            console.warn("EnemyRacer import failed:", err);
            return null;
        });
    }

    // ----------------------------
    // Loop
    // ----------------------------
    _loop(now) {
        if (!this.running) return;
        const dt = Math.min(0.05, (now - this.lastTime) / 1000); // clamp dt to avoid huge steps
        this.lastTime = now;

        this._update(dt);
        this._draw();

        requestAnimationFrame(this._loop.bind(this));
    }

    _update(dt) {
        // update controls state is read at player.update
        // player.update(delta, controls)
        try {
            this.player.update(dt, this.controls);
        } catch (err) {
            // Some Racer.js signatures are different (update(input, dt)) - try fallback
            try { this.player.update(this.controls, dt); }
            catch (e) { /* ignore */ }
        }

        // camera update (call with dt if it expects)
        if (this.camera) {
            try { this.camera.update(dt); } catch (e) { try { this.camera.update(); } catch(_){} }
        }

        // update enemies (they must have update(player, track, dt) or update(dt, track) or update(track))
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const en = this.enemies[i];
            // prefer lane/position based enemy update signature: en.update(player, track, dt)
            if (typeof en.update === "function") {
                try { en.update(this.player, this.track, dt); }
                catch (err) {
                    try { en.update(this.track, dt); }
                    catch (e) { en.update && en.update(); }
                }
            }
            // Remove enemies that are far behind (simple cleanup)
            if (en.position && (en.position < (this.player.position - 800))) {
                this.enemies.splice(i,1);
            }
        }

        // update powerups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const p = this.powerUps[i];
            p.update(dt, this.track);
            if (p.checkCollision && p.checkCollision(this.player)) {
                // pickup effect
                this.player.applyPowerUp?.(p.type);
                this.ui?.showPickupEffect?.(p.type);
                this.powerUps.splice(i,1);
                continue;
            }
            // remove powerups that are behind
            if (p.position && (p.position < (this.player.position - 200))) {
                this.powerUps.splice(i,1);
            }
        }

        // player vs enemy collisions — simple AABB on projected screen boxes
        for (const en of this.enemies) {
            // both must have position and lane and track.project should produce screen pos
            const sp = this.track.project(this.player.position, this.player.lane);
            const se = this.track.project(en.position, en.lane);
            if (!sp || !se) continue;
            // compute approximate screen rect sizes scaled by scale
            const pW = (this.player.width || 100) * (sp.scale || 1);
            const pH = (this.player.height || 200) * (sp.scale || 1);
            const eW = (en.width || 80) * (se.scale || 1);
            const eH = (en.height || 160) * (se.scale || 1);

            const px = sp.x, py = sp.y;
            const ex = se.x, ey = se.y;

            if (Math.abs(px - ex) < (pW/2 + eW/2) && Math.abs(py - ey) < (pH/2 + eH/2)) {
                // collision!
                if (this.player.crash) this.player.crash();
                if (en.onCollide) en.onCollide && en.onCollide(this.player);
                // create camera shake if camera supports it
                if (this.camera && typeof this.camera.triggerShake === "function") {
                    this.camera.triggerShake(0.4);
                }
            }
        }

        // spawn extra enemies if below target
        if (this.enemies.length < this.enemyCountTarget) {
            this.spawnEnemy();
        }
    }

    _draw() {
        const ctx = this.ctx;
        // clear with black
        ctx.save();
        ctx.setTransform(1,0,0,1,0,0); // reset transforms
        ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
        ctx.fillStyle = "#000";
        ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
        ctx.restore();

        // draw track background (if Track provides draw)
        if (this.track && typeof this.track.draw === "function") {
            try { this.track.draw(ctx, this.camera); } catch(e) { this.track.drawRoad?.(ctx); }
        }

        // draw powerups (those further away first sorted by position descending)
        const puSorted = this.powerUps.slice().sort((a,b)=> (b.position||0) - (a.position||0));
        for (const p of puSorted) {
            p.draw(ctx, this.camera);
        }

        // draw enemies (sorted by position descending so far ones draw first)
        const enSorted = this.enemies.slice().sort((a,b)=> (b.position||0) - (a.position||0));
        for (const e of enSorted) {
            try { e.draw(ctx, this.camera, this.track); } catch(err) { e.draw && e.draw(ctx); }
        }

        // draw player on top
        try { this.player.draw(ctx, this.camera, this.track); } catch(e) { this.player.draw && this.player.draw(ctx); }

        // HUD
        if (this.ui && typeof this.ui.drawHUD === "function") {
            this.ui.drawHUD?.(ctx, this.player);
        } else {
            // simple HUD fallback
            ctx.save();
            ctx.fillStyle = "white";
            ctx.font = `${18 * (window.devicePixelRatio||1)}px Arial`;
            const speedText = `Speed: ${Math.round(this.player.speed || 0)}`;
            ctx.fillText(speedText, 20 * (window.devicePixelRatio||1), 30 * (window.devicePixelRatio||1));
            ctx.restore();
        }

        // debug overlays
        if (this.debug) {
            ctx.save();
            ctx.fillStyle = "rgba(255,255,255,0.85)";
            ctx.font = "14px monospace";
            ctx.fillText(`Enemies: ${this.enemies.length}`, 12, 48);
            ctx.fillText(`PowerUps: ${this.powerUps.length}`, 12, 64);
            ctx.fillText(`Player pos: ${Math.round(this.player.position||0)}`, 12, 80);
            ctx.restore();
        }
    }

    // ----------------------------
    // Utility for external calls
    // ----------------------------
    setDebug(enabled) {
        this.debug = !!enabled;
        this._applyDebugVisibility();
    }

    // add a power-up programmatically
    addPowerUp(type="coin", lane = 0, position = null) {
        import("./PowerUp.js").then(mod => {
            const PowerUpCtor = mod.default;
            const pos = position || (this.player.position + 400 + Math.random()*800);
            const img = type === "coin" ? this.images.coin : (type==="nitro" ? this.images.nitro : this.images.health);
            const p = new PowerUpCtor(img, lane, pos, type);
            this.powerUps.push(p);
        });
    }

    // collision-safe spawn enemy wrapper for external UI
    spawnEnemyAt(lane = null, position = null) {
        const laneChoice = lane !== null ? lane : [-1,0,1][Math.floor(Math.random()*3)];
        const pos = position !== null ? position : (this.player.position + 500 + Math.random()*1200);
        return import("./EnemyRacer.js").then(mod => {
            const EnemyCtor = mod.default;
            const e = new EnemyCtor(laneChoice, pos);
            this.enemies.push(e);
            return e;
        });
    }

    // reset race very quickly
    quickReset() {
        this.resetRace();
    }
}
