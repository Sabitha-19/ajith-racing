import TouchControls from "./scripts/TouchControls.js";
import Racer from "./scripts/Racer.js";
import Track from "./scripts/Track.js";
import Camera from "./scripts/Camera.js";
import EnemyRacer from "./scripts/EnemyRacer.js";

// ---- CONFIG ----
const ASSET_PATH = "assets/";

// ---- Canvas setup ----
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// ---- Helpers ----
function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// ---- Load images ----
const carImage = new Image(); carImage.src = ASSET_PATH + "car.png";
const roadImage = new Image(); roadImage.src = ASSET_PATH + "road.png";
const enemyImage = new Image(); enemyImage.src = ASSET_PATH + "enemy.png";

const coinImage = new Image(); coinImage.src = ASSET_PATH + "coin.png";
const nitroPickImage = new Image(); nitroPickImage.src = ASSET_PATH + "nitro.png";
const healthPickImage = new Image(); healthPickImage.src = ASSET_PATH + "health.png";
const flameImage = new Image(); flameImage.src = ASSET_PATH + "flame.png"; // nitro flame visual

// ---- Load sounds (make sure files exist at ASSET_PATH) ----
const engineSound = new Audio(ASSET_PATH + "engine.mp3"); engineSound.loop = true; engineSound.volume = 0.45;
const driftSound = new Audio(ASSET_PATH + "drift.mp3"); driftSound.volume = 0.7;
const crashSound = new Audio(ASSET_PATH + "crash.mp3"); crashSound.volume = 0.8;
const nitroSound = new Audio(ASSET_PATH + "nitro.mp3"); nitroSound.volume = 0.9;
const brakeSound = new Audio(ASSET_PATH + "brake.mp3"); brakeSound.volume = 0.7;

// ---- Game objects ----
const controls = new TouchControls();
const racer = new Racer(carImage); // assumes Racer has width/height properties
const track = new Track(roadImage);
const camera = new Camera();

// ---- Enemies ----
const enemies = [];
for (let i = 0; i < 5; i++) {
  enemies.push(new EnemyRacer(enemyImage, Math.random() * 2400 - 1200, Math.random() * 2400 - 1200));
}

// ---- Power-ups (spawn many randomly) ----
const powerUps = [];
for (let i = 0; i < 24; i++) {
  const type = ["coin","nitro","health"][Math.floor(Math.random()*3)];
  powerUps.push({
    type,
    x: Math.random()*3000 - 1500,
    y: Math.random()*3000 - 1500,
    width: 40,
    height: 40,
    spin: Math.random()*Math.PI*2
  });
}

let score = 0;
let screenFlash = 0; // 0..1 fade for crash flash

// small wrapper to get input robustly (works with different TouchControls versions)
function getInput() {
  if (!controls) return { x:0, y:0, nitro:false, brake:false };
  if (typeof controls.getInput === "function") {
    const inp = controls.getInput();
    // unify names: prefer steer/throttle or x/y
    return {
      x: inp.steer ?? inp.x ?? 0,
      y: inp.throttle ?? inp.y ?? 0,
      nitro: inp.nitro ?? false,
      brake: inp.brake ?? false
    };
  }
  // some versions use properties directly
  return {
    x: controls.input?.x ?? 0,
    y: controls.input?.y ?? 0,
    nitro: controls.input?.nitro ?? false,
    brake: controls.input?.brake ?? false
  };
}

// ---- Nitro flame drawing helper ----
function drawNitroFlame(ctx, racer, camera, intensity = 1) {
  if (!flameImage.complete) return;
  // flame position behind car
  const px = racer.x - Math.cos(racer.angle) * (racer.height/2 + 6);
  const py = racer.y - Math.sin(racer.angle) * (racer.height/2 + 6);
  const screenX = px - camera.x + canvas.width/2;
  const screenY = py - camera.y + canvas.height/2;
  const scale = 0.7 + intensity * 0.8;
  ctx.save();
  ctx.translate(screenX, screenY);
  ctx.rotate(racer.angle);
  ctx.globalAlpha = 0.6 * intensity;
  const w = flameImage.width ? 40 * scale : 30 * scale;
  const h = flameImage.height ? 60 * scale : 45 * scale;
  ctx.drawImage(flameImage, -w/2, -h/2, w, h);
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ---- Main loop ----
function loop() {
  requestAnimationFrame(loop);

  const input = getInput();

  // Update systems (game physics)
  racer.update({ steer: input.x, throttle: input.y, nitro: input.nitro, brake: input.brake });
  camera.update(racer);
  track.update(racer);
  enemies.forEach(e => e.update(racer));
  powerUps.forEach(p => p.spin += 0.06);

  // --- SOUND LOGIC ---
  try {
    if (racer.speed > 0.5) { if (engineSound.paused) engineSound.play().catch(()=>{}); } else engineSound.pause();
  } catch(e){}

  // Use input.x for steering intensity (no racer.turn property assumed)
  const steerIntensity = Math.abs(input.x || 0);
  if (steerIntensity > 0.45 && racer.speed > 2) {
    if (driftSound.paused) driftSound.play().catch(()=>{});
  } else { driftSound.pause(); driftSound.currentTime = 0; }

  if (input.brake && racer.speed > 1) {
    if (brakeSound.paused) brakeSound.play().catch(()=>{});
  }

  if (input.nitro && racer.nitroActive) {
    if (nitroSound.paused) nitroSound.play().catch(()=>{});
  } else { nitroSound.pause(); nitroSound.currentTime = 0; }

  // --- COLLISIONS: enemies ---
  for (const enemy of enemies) {
    // ensure width/height exist (fallback)
    enemy.width = enemy.width || 50;
    enemy.height = enemy.height || 100;
    racer.width = racer.width || 50;
    racer.height = racer.height || 100;

    if (isColliding(racer, enemy)) {
      // crash response
      crashSound.play().catch(()=>{});
      screenFlash = 0.95;               // strong flash
      // small knockback
      racer.x -= Math.cos(racer.angle) * 60;
      racer.y -= Math.sin(racer.angle) * 60;
      racer.speed = Math.max(0, racer.speed * 0.2);
      // optionally respawn or move enemy away
      enemy.x += (Math.random()-0.5)*300;
      enemy.y += (Math.random()-0.5)*300;
    }
  }

  // --- COLLISIONS: power-ups ---
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const p = powerUps[i];
    // bounding properties
    const pBox = { x: p.x, y: p.y, width: p.width, height: p.height };
    if (isColliding(racer, pBox)) {
      if (p.type === "coin") {
        score++;
      } else if (p.type === "nitro") {
        // give racer temporary nitro resource (Racer must consume it in its update)
        racer.nitroActive = true;
        racer.nitroTime = Math.max(racer.nitroTime || 0, 1.6); // seconds
      } else if (p.type === "health") {
        racer.health = Math.min(100, (racer.health || 100) + 30);
      }
      // remove and respawn somewhere else later
      p.x = Math.random()*3000 - 1500;
      p.y = Math.random()*3000 - 1500;
    }
  }

  // --- Draw world ---
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // track (tiles)
  if (typeof track.draw === "function") track.draw(ctx, camera);

  // draw power-ups (behind player or in front as desired)
  for (const p of powerUps) {
    const screenX = p.x - camera.x + canvas.width/2;
    const screenY = p.y - camera.y + canvas.height/2;
    ctx.save();
    ctx.translate(screenX + p.width/2, screenY + p.height/2);
    ctx.rotate(p.spin);
    const img = p.type === "coin" ? coinImage : (p.type === "nitro" ? nitroPickImage : healthPickImage);
    if (img.complete) ctx.drawImage(img, -p.width/2, -p.height/2, p.width, p.height);
    else {
      ctx.fillStyle = p.type === "coin" ? "gold" : (p.type === "nitro" ? "cyan" : "lime");
      ctx.fillRect(-p.width/2, -p.height/2, p.width, p.height);
    }
    ctx.restore();
  }

  // draw enemies
  for (const e of enemies) {
    if (typeof e.draw === "function") e.draw(ctx, camera);
  }

  // draw racer (if nitro active show flame)
  racer.draw(ctx, camera);
  // draw nitro flame if active (use nitroTime or racer.nitroActive)
  const nitroActive = !!racer.nitroTime || !!racer.nitroActive;
  if (nitroActive) {
    const intensity = clamp((racer.nitroTime || 1)/1.6, 0.2, 1.5);
    drawNitroFlame(ctx, racer, camera, intensity);
  }

  // HUD - speed, coins, health, nitro bar
  ctx.save();
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Speed: " + Math.round(racer.speed), 20, 34);
  ctx.fillText("Coins: " + score, 20, 64);

  // Health bar
  const health = clamp(racer.health ?? 100, 0, 100);
  const hbX = canvas.width - 220, hbY = 20, hbW = 200, hbH = 18;
  ctx.fillStyle = "#333";
  ctx.fillRect(hbX, hbY, hbW, hbH);
  ctx.fillStyle = health > 60 ? "#4caf50" : (health > 30 ? "#ffb300" : "#f44336");
  ctx.fillRect(hbX, hbY, hbW * (health/100), hbH);
  ctx.strokeStyle = "#fff"; ctx.strokeRect(hbX, hbY, hbW, hbH);
  ctx.fillStyle = "white";
  ctx.fillText("HP", hbX - 36, hbY + 14);

  // Nitro bar (if racer has nitro resource)
  const nitroVal = clamp(racer.nitroTime ?? 0, 0, 1.6);
  const nbX = canvas.width - 220, nbY = 48, nbW = 200, nbH = 12;
  ctx.fillStyle = "#222";
  ctx.fillRect(nbX, nbY, nbW, nbH);
  ctx.fillStyle = "#00d8ff";
  ctx.fillRect(nbX, nbY, nbW * (nitroVal/1.6), nbH);
  ctx.strokeStyle = "#fff"; ctx.strokeRect(nbX, nbY, nbW, nbH);
  ctx.fillText("NITRO", nbX - 64, nbY + 10);

  ctx.restore();

  // screen flash (damage)
  if (screenFlash > 0) {
    ctx.save();
    ctx.globalAlpha = screenFlash;
    ctx.fillStyle = "#ff4444";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.restore();
    screenFlash *= 0.92;
  } else screenFlash = 0;
}

loop();
