// main.js
import TouchControls from "./scripts/TouchControls.js";
import Racer from "./scripts/Racer.js";
import Track from "./scripts/Track.js";
import Camera from "./scripts/Camera.js";
import EnemyRacer from "./scripts/EnemyRacer.js";

// -------- CONFIG --------
const ASSET_PATH = "assets/";
const FLAME_SRC = "/mnt/data/A_2D_digital_illustration_of_a_nitro_can_is_featur.png"; 
// if you move flame into repo, change the above to ASSET_PATH + "flame.png"

// -------- Canvas setup --------
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// -------- Utilities --------
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// -------- Assets --------
const carImage = new Image(); carImage.src = ASSET_PATH + "car.png";
const roadImage = new Image(); roadImage.src = ASSET_PATH + "road.png";
const enemyImage = new Image(); enemyImage.src = ASSET_PATH + "enemy.png";

const coinImage = new Image(); coinImage.src = ASSET_PATH + "coin.png";
const nitroPickImage = new Image(); nitroPickImage.src = ASSET_PATH + "nitro.png";
const healthPickImage = new Image(); healthPickImage.src = ASSET_PATH + "health.png";

const flameImage = new Image();
flameImage.src = FLAME_SRC;

// -------- Sounds (ensure these exist in assets/) --------
const engineSound = new Audio(ASSET_PATH + "engine.mp3"); engineSound.loop = true; engineSound.volume = 0.45;
const driftSound  = new Audio(ASSET_PATH + "drift.mp3"); driftSound.volume  = 0.7;
const crashSound  = new Audio(ASSET_PATH + "crash.mp3"); crashSound.volume  = 0.9;
const nitroSound  = new Audio(ASSET_PATH + "nitro.mp3"); nitroSound.volume  = 0.9;
const brakeSound  = new Audio(ASSET_PATH + "brake.mp3"); brakeSound.volume  = 0.7;

// -------- Game objects --------
const controls = new TouchControls();
const racer = new Racer(carImage);
const track = new Track(roadImage);
const camera = new Camera();

// enemies
const enemies = [];
for (let i = 0; i < 5; i++) {
  enemies.push(new EnemyRacer(enemyImage, Math.random() * 2400 - 1200, Math.random() * 2400 - 1200));
}

// power-ups / coins
// NOTE: you told coin size 1920x1920 previously — if this is too large change COIN_W/COIN_H to 64 or 128
const COIN_W = 1920, COIN_H = 1920;
const powerUps = [];
for (let i = 0; i < 24; i++) {
  const type = ["coin","nitro","health"][Math.floor(Math.random()*3)];
  powerUps.push({
    type,
    x: Math.random()*3000 - 1500,
    y: Math.random()*3000 - 1500,
    width: type === "coin" ? COIN_W : 64,
    height: type === "coin" ? COIN_H : 64,
    angle: Math.random()*Math.PI*2,
    spin: Math.random()*0.06 + 0.02
  });
}

let score = 0;
let screenFlash = 0;

// -------- Input adapter for different TouchControls versions --------
function getInput() {
  if (!controls) return { x:0, y:0, nitro:false, brake:false };
  if (typeof controls.getInput === "function") {
    const inp = controls.getInput();
    return {
      x: inp.steer ?? inp.x ?? 0,
      y: inp.throttle ?? inp.y ?? 0,
      nitro: inp.nitro ?? false,
      brake: inp.brake ?? false
    };
  }
  // fallback
  return {
    x: controls.input?.x ?? 0,
    y: controls.input?.y ?? 0,
    nitro: controls.input?.nitro ?? false,
    brake: controls.input?.brake ?? false
  };
}

// -------- Nitro flame draw helper --------
function drawNitroFlame(ctx, racer, camera, intensity = 1) {
  if (!flameImage.complete) return;
  const px = racer.x - Math.cos(racer.angle) * (racer.height/2 + 8);
  const py = racer.y - Math.sin(racer.angle) * (racer.height/2 + 8);
  const sx = px - camera.x + canvas.width/2;
  const sy = py - camera.y + canvas.height/2;
  const scale = 0.7 + intensity * 0.9;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(racer.angle);
  ctx.globalAlpha = 0.6 * clamp(intensity, 0.2, 1.2);
  const w = 80 * scale;
  const h = 120 * scale;
  ctx.drawImage(flameImage, -w/2, -h/2, w, h);
  ctx.globalAlpha = 1;
  ctx.restore();
}

// -------- Main loop --------
function loop() {
  requestAnimationFrame(loop);
  const input = getInput();

  // Update game objects
  racer.update({ steer: input.x, throttle: input.y, nitro: input.nitro, brake: input.brake });
  camera.update(racer);
  track.update(racer);
  enemies.forEach(e => e.update(racer));
  powerUps.forEach(p => p.angle += p.spin);

  // --- Sounds ---
  try {
    if (racer.speed > 0.5) { if (engineSound.paused) engineSound.play().catch(()=>{}); } else engineSound.pause();
  } catch(e){}

  const steerIntensity = Math.abs(input.x || 0);
  if (steerIntensity > 0.45 && racer.speed > 2) {
    if (driftSound.paused) driftSound.play().catch(()=>{});
  } else { driftSound.pause(); driftSound.currentTime = 0; }

  if (input.brake && racer.speed > 1) { if (brakeSound.paused) brakeSound.play().catch(()=>{}); }

  if (input.nitro && racer.nitroActive) {
    if (nitroSound.paused) nitroSound.play().catch(()=>{});
  } else { nitroSound.pause(); nitroSound.currentTime = 0; }

  // --- Collisions with enemies (damage)
  for (const enemy of enemies) {
    enemy.width = enemy.width || 50;
    enemy.height = enemy.height || 100;
    racer.width = racer.width || 50;
    racer.height = racer.height || 100;

    if (isColliding(racer, enemy)) {
      crashSound.play().catch(()=>{});
      screenFlash = 0.95;
      // knockback & slow
      racer.x -= Math.cos(racer.angle) * 60;
      racer.y -= Math.sin(racer.angle) * 60;
      racer.takeDamage?.(20); // calls racer.takeDamage if exists
      racer.speed = Math.max(0, racer.speed * 0.2);
      enemy.x += (Math.random() - 0.5) * 300;
      enemy.y += (Math.random() - 0.5) * 300;
    }
  }

  // --- Power-up collisions ---
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const p = powerUps[i];
    const pBox = { x: p.x - p.width/2, y: p.y - p.height/2, width: p.width, height: p.height };
    if (isColliding(racer, pBox)) {
      if (p.type === "coin") {
        score++;
      } else if (p.type === "nitro") {
        racer.nitroActive = true;
        racer.nitroTime = Math.max(racer.nitroTime || 0, 1.6);
      } else if (p.type === "health") {
        racer.health = Math.min(100, (racer.health || 100) + 30);
      }
      // respawn instead of remove
      p.x = Math.random()*3000 - 1500;
      p.y = Math.random()*3000 - 1500;
    }
  }

  // --- Drawing ---
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // track
  if (typeof track.draw === "function") track.draw(ctx, camera);

  // power-ups
  for (const p of powerUps) {
    const sx = p.x - camera.x + canvas.width/2;
    const sy = p.y - camera.y + canvas.height/2;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(p.angle);
    const img = p.type === "coin" ? coinImage : (p.type === "nitro" ? nitroPickImage : healthPickImage);
    const w = p.width, h = p.height;
    if (img.complete) ctx.drawImage(img, -w/2, -h/2, w, h);
    else {
      ctx.fillStyle = p.type === "coin" ? "gold" : (p.type === "nitro" ? "cyan" : "lime");
      ctx.fillRect(-w/2, -h/2, w, h);
    }
    ctx.restore();
  }

  // enemies
  enemies.forEach(e => { if (typeof e.draw === "function") e.draw(ctx, camera); });

  // racer
  racer.draw(ctx, camera);

  // nitro flame
  const nitroActive = !!racer.nitroTime || !!racer.nitroActive;
  if (nitroActive) {
    const intensity = clamp((racer.nitroTime || 1) / 1.6, 0.2, 1.5);
    drawNitroFlame(ctx, racer, camera, intensity);
  }

  // HUD - speed, coins, health, nitro
  ctx.save();
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Speed: " + Math.round(racer.speed), 20, 34);
  ctx.fillStyle = "yellow";
  ctx.fillText("Coins: " + score, 20, 64);

  // health bar (top-right)
  const health = clamp(racer.health ?? 100, 0, 100);
  const hbX = canvas.width - 220, hbY = 20, hbW = 200, hbH = 18;
  ctx.fillStyle = "#333"; ctx.fillRect(hbX, hbY, hbW, hbH);
  ctx.fillStyle = health > 60 ? "#4caf50" : (health > 30 ? "#ffb300" : "#f44336");
  ctx.fillRect(hbX, hbY, hbW * (health/100), hbH);
  ctx.strokeStyle = "#fff"; ctx.strokeRect(hbX, hbY, hbW, hbH);
  ctx.fillStyle = "white";
  ctx.fillText("HP", hbX - 36, hbY + 14);

  // nitro bar
  const nitroVal = clamp(racer.nitroTime ?? 0, 0, 1.6);
  const nbX = canvas.width - 220, nbY = 48, nbW = 200, nbH = 12;
  ctx.fillStyle = "#222"; ctx.fillRect(nbX, nbY, nbW, nbH);
  ctx.fillStyle = "#00d8ff"; ctx.fillRect(nbX, nbY, nbW * (nitroVal/1.6), nbH);
  ctx.strokeStyle = "#fff"; ctx.strokeRect(nbX, nbY, nbW, nbH);
  ctx.fillText("NITRO", nbX - 64, nbY + 10);

  ctx.restore();

  // screen flash on damage
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
