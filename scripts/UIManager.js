// scripts/UIManager.js
// Handles UI overlays, menus, score display, and puzzle completion

export default class UIManager {
    /**
     * @param {HTMLElement} gameContainer - The main DOM element to attach menus to.
     */
    constructor(gameContainer) {
        this.container = gameContainer || document.body;

        // Initialize internal callback functions
        this.onPlayGame = () => {};
        this.onCountrySelected = () => {};

        // Create all UI elements
        this._createMainMenu();
        this._createCountryMenu();
        this._createHUD();
        
        // Start by showing the main menu
        this.showMainMenu();
        this.hideHUD(); // HUD should be hidden until the race starts
    }
    
    // --- Public method to attach external game logic ---
    hookCallbacks(callbacks) {
        if (callbacks.onPlay) this.onPlayGame = callbacks.onPlay;
        if (callbacks.onSelectCountry) this.onCountrySelected = callbacks.onSelectCountry;
    }

    // -----------------------
    // Main Menu
    // -----------------------
    _createMainMenu() {
        this.mainMenu = document.createElement("div");
        this.mainMenu.id = "mainMenu";
        this.mainMenu.className = "ui-menu"; // Use a CSS class for general menu styling
        
        // Apply inline styles for centering/layering (matching your original intent)
        this.mainMenu.style.position = "absolute";
        this.mainMenu.style.left = "50%";
        this.mainMenu.style.top = "50%";
        this.mainMenu.style.transform = "translate(-50%, -50%)";
        this.mainMenu.style.background = "#222";
        this.mainMenu.style.padding = "30px";
        this.mainMenu.style.borderRadius = "12px";
        this.mainMenu.style.color = "white";
        this.mainMenu.style.textAlign = "center";
        this.mainMenu.style.zIndex = "1000";

        const title = document.createElement("h1");
        title.innerText = "Racing Puzzle Game";
        this.mainMenu.appendChild(title);

        const playBtn = document.createElement("button");
        playBtn.innerText = "Start Puzzle";
        playBtn.style.marginTop = "20px";
        playBtn.onclick = () => {
            this.hideMainMenu();
            // Call the hooked function
            this.onPlayGame(); 
        };
        this.mainMenu.appendChild(playBtn);

        this.container.appendChild(this.mainMenu);
    }

    showMainMenu() {
        this.mainMenu.style.display = "block";
    }
    hideMainMenu() {
        this.mainMenu.style.display = "none";
    }

    // -----------------------
    // Country Selection Menu
    // -----------------------
    _createCountryMenu() {
        this.countryMenu = document.createElement("div");
        this.countryMenu.id = "countryMenu";
        this.countryMenu.className = "ui-menu";
        
        // Apply inline styles
        this.countryMenu.style.position = "absolute";
        this.countryMenu.style.left = "50%";
        this.countryMenu.style.top = "50%";
        this.countryMenu.style.transform = "translate(-50%, -50%)";
        this.countryMenu.style.background = "#333";
        this.countryMenu.style.padding = "20px";
        this.countryMenu.style.borderRadius = "10px";
        this.countryMenu.style.color = "white";
        this.countryMenu.style.textAlign = "center";
        this.countryMenu.style.zIndex = "1000";
        this.countryMenu.style.display = "none";

        const title = document.createElement("h2");
        title.innerText = "Select Racing Country";
        this.countryMenu.appendChild(title);

        // Map country names to buttons
        const countries = ["USA 🇺🇸", "France 🇫🇷", "Japan 🇯🇵", "India 🇮🇳"];
        countries.forEach(nameWithFlag => {
            const name = nameWithFlag.split(' ')[0]; // Extract name for internal use
            const btn = document.createElement("button");
            btn.innerText = nameWithFlag;
            btn.style.margin = "5px";
            btn.onclick = () => {
                this.hideCountryMenu();
                // Call the hooked function with the selected country name
                this.onCountrySelected(name);
            };
            this.countryMenu.appendChild(btn);
        });

        this.container.appendChild(this.countryMenu);
    }

    showCountryMenu() {
        this.countryMenu.style.display = "block";
    }
    hideCountryMenu() {
        this.countryMenu.style.display = "none";
    }

    // -----------------------
    // In-game HUD (score, timer)
    // -----------------------
    _createHUD() {
        this.hud = document.createElement("div");
        this.hud.id = "hud";
        this.hud.style.position = "absolute";
        this.hud.style.top = "10px";
        this.hud.style.right = "10px"; // Position top right for non-score info
        this.hud.style.color = "white";
        this.hud.style.fontFamily = "Arial";
        this.hud.style.fontSize = "16px";
        this.hud.style.zIndex = "900";
        this.hud.innerText = "Time: 0:00"; // Placeholder text

        this.container.appendChild(this.hud);
    }

    showHUD() {
        this.hud.style.display = "block";
    }
    hideHUD() {
        this.hud.style.display = "none";
    }

    // Since RacerGame draws the complex HUD (health, coins, etc.) on canvas, 
    // this HTML HUD is used for external timing or messages.
    updateGameTime(timeInSeconds) {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
        this.hud.innerText = `Race Time: ${minutes}:${seconds}`;
    }
    
    updateScore(score) {
        // You can add a score element here if needed separate from race time
        // For now, we reuse the HUD element or leave it to the canvas rendering.
    }
    
    // --- Cleanup/Destruction ---
    destroy() {
        // Remove all created UI elements
        this.mainMenu.remove();
        this.countryMenu.remove();
        this.hud.remove();
    }
}
