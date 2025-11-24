// main.js

import Puzzle from './scripts/puzzle.js';
import RacerGame from './scripts/RacerGame.js';
import TouchControls from './scripts/TouchControls.js';
import UIManager from './scripts/UIManager.js';

// --- Global Variables ---
const gameContainer = document.getElementById('game-container');
let gameCanvas;
let uiManager;
const assets = {}; // Store loaded image assets

// Define asset paths (must match the files in the 'assets' folder)
const assetPaths = {
    car: 'assets/car.png',
    enemy: 'assets/enemy.png',
    coin: 'assets/coin.png',
    nitro: 'assets/nitro.png',
    health: 'assets/health.png',
    // ... add all required assets here
};

// --- Asset Loading Function ---
const loadAssets = async () => {
    const promises = [];
    for (const key in assetPaths) {
        const img = new Image();
        img.src = assetPaths[key];
        assets[key] = img;
        promises.push(new Promise(res => img.onload = res));
    }
    await Promise.all(promises);
    console.log("Assets loaded.");
};

// --- Canvas Initialization ---
const initCanvas = () => {
    if (gameCanvas) gameCanvas.remove();
    
    gameCanvas = document.createElement('canvas');
    gameCanvas.id = 'game-canvas';
    gameCanvas.width = 960;
    gameCanvas.height = 720; 
    gameContainer.appendChild(gameCanvas);
};

// --- Game Flow Functions ---

const startRacingGame = () => {
    console.log("Starting Racing Game...");
    initCanvas(); 
    
    const game = new RacerGame({
        canvas: gameCanvas,
        assets
    });

    const controls = new TouchControls(gameCanvas);
    game.setControls(controls); 
    
    if (uiManager) uiManager.destroy();
    uiManager = new UIManager(gameContainer);
    uiManager.initRaceUI(game);

    game.start();
};

const startPuzzle = () => {
    console.log("Starting Puzzle...");
    initCanvas();
    
    const puzzle = new Puzzle({
        canvas: gameCanvas,
        rows: 7,
        cols: 7,
        tileSize: 64,
        timeLimitSec: 45,
        progressTarget: 6
    }, () => {
        // Completion callback
        puzzle.destroy(); 
        startRacingGame();
    });
    
    puzzle.start();
};


// --- Main Execution Function ---
const startGame = async () => {
    await loadAssets();
    
    // Start the game flow with the puzzle
    startPuzzle();
};

// Start the game initialization process
startGame();
