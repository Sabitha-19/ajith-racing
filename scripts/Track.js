// scripts/Track.js
// ---------------------------------------------
// Pure 2D Track Engine
// Provides:
//  - project(position, lane) -> { x, y, scale }
//  - update(delta)
//  - draw(ctx)
// ---------------------------------------------

export default class Track {
    constructor(assets = {}) {
        // assets.road, assets.background
        this.assets = assets;

        // projection settings
        this.roadWidth = 1800;       // world distance width
        this.screenRoadWidth = 1400; // how wide it appears on screen (scaled)
        this.cameraHeight = 1200;    // higher = farther view
        this.horizon = 180;          // y-pos of horizon

        // world curves
        this.curve = 0;
        this.curveTarget = 0;
        this.curveStrength = 0.06;

        // internal time for slight waving roads
        this._t = 0;
    }

    // Called every frame by RacerGame
    update(delta) {
        this._t += delta;

        // auto waving for realism
        const wave = Math.sin(this._t * 0.3) * 0.5;
        this.curveTarget = wave;

        // smooth towards curveTarget
        this.curve += (this.curveTarget - this.curve) * 0.02;
    }

    // ---------------------------------------------
    // PROJECT WORLD POSITION TO SCREEN
    // position = forward z
    // lane = -1..1
    // returns: { x, y, scale }
    // ---------------------------------------------
    project(position, lane = 0) {
        // world depth simul
        const dz = Math.max(1, position);
        const scale = this.cameraHeight / (this.cameraHeight + dz);

        // forward -> screen y
        const y = this.horizon + scale * (900);

        // lane offset
        const laneX = lane * (this.screenRoadWidth * 0.3);

        // road-curving
        const curveOffset = this.curve * Math.pow(scale, 1.8) * 900;

        const x = innerWidth / 2 + laneX * scale + curveOffset;

        return { x, y, scale };
    }

    // ---------------------------------------------
    // DRAW BACKGROUND + ROAD
    // ---------------------------------------------
    draw(ctx) {
        const W = ctx.canvas.width;
        const H = ctx.canvas.height;

        // -----------------------------------------
        // BACKGROUND
        // -----------------------------------------
        if (this.assets.background && this.assets.background.complete) {
            ctx.drawImage(this.assets.background, 0, 0, W, H * 0.6);
        } else {
            // fallback gradient
            const g = ctx.createLinearGradient(0, 0, 0, H * 0.6);
            g.addColorStop(0, "#0a0f25");
            g.addColorStop(1, "#14305f");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H * 0.6);
        }

        // -----------------------------------------
        // ROAD (simple perspective trapezoid)
        // -----------------------------------------
        const roadTop = this.horizon;
        const roadBottom = H;

        const roadTopW = W * 0.30;
        const roadBottomW = W * 0.88;

        const curveOffset = this.curve * 300;

        ctx.fillStyle = "#2b2b2b";
        ctx.beginPath();
        ctx.moveTo(W / 2 - roadTopW + curveOffset, roadTop);
        ctx.lineTo(W / 2 + roadTopW + curveOffset, roadTop);
        ctx.lineTo(W / 2 + roadBottomW - curveOffset, roadBottom);
        ctx.lineTo(W / 2 - roadBottomW - curveOffset, roadBottom);
        ctx.closePath();
        ctx.fill();

        // road stripes
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        const stripeCount = 18;

        for (let i = 0; i < stripeCount; i++) {
            const z = (i / stripeCount) * 6000;
            const scr = this.project(z, 0);
            const stripeW = scr.scale * roadTopW * 0.6;

            ctx.beginPath();
            ctx.moveTo(scr.x - stripeW * 0.4, scr.y);
            ctx.lineTo(scr.x + stripeW * 0.4, scr.y);
            ctx.stroke();
        }
    }
}
