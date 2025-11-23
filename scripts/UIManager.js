// ===========================================
//               UI MANAGER
// ===========================================

export class UIManager {
    constructor() {
        // DOM elements
        this.puzzleContainer = document.getElementById("puzzle-container");
        this.countryMenu = document.getElementById("country-menu");
        this.puzzleCompleteBanner = document.getElementById("puzzle-complete");

        this.countryMenuVisible = false;
    }

    // -------------------------------------------------
    //                 PUZZLE UI
    // -------------------------------------------------

    showPuzzle() {
        if (this.puzzleContainer) {
            this.puzzleContainer.style.display = "flex";
        }
    }

    hidePuzzle() {
        if (this.puzzleContainer) {
            this.puzzleContainer.style.display = "none";
        }
    }

    // -------------------------------------------------
    //       PUZZLE COMPLETE — ANIMATED CELEBRATION
    // -------------------------------------------------

    showPuzzleCompleteAnimation(callback) {
        if (!this.puzzleCompleteBanner) return callback();

        this.puzzleCompleteBanner.style.opacity = 0;
        this.puzzleCompleteBanner.style.display = "block";

        setTimeout(() => {
            this.puzzleCompleteBanner.style.transition = "0.6s ease";
            this.puzzleCompleteBanner.style.transform = "scale(1)";
            this.puzzleCompleteBanner.style.opacity = 1;
        }, 50);

        // Fade-out after 1.3 seconds
        setTimeout(() => {
            this.puzzleCompleteBanner.style.opacity = 0;
            this.puzzleCompleteBanner.style.transform = "scale(0.7)";
        }, 1300);

        // Fully remove from UI and trigger callback
        setTimeout(() => {
            this.puzzleCompleteBanner.style.display = "none";
            if (callback) callback();
        }, 1900);
    }

    // -------------------------------------------------
    //                COUNTRY MENU UI
    // -------------------------------------------------

    showCountryMenu() {
        if (this.countryMenu) {
            this.countryMenu.style.display = "flex";
            this.countryMenuVisible = true;
        }
    }

    hideCountryMenu() {
        if (this.countryMenu) {
            this.countryMenu.style.display = "none";
            this.countryMenuVisible = false;
        }
    }

    // -------------------------------------------------
    //         RACING UI / HUD (OPTIONAL)
    // -------------------------------------------------

    showHUD() {
        const hud = document.getElementById("hud");
        if (hud) hud.style.display = "block";
    }

    hideHUD() {
        const hud = document.getElementById("hud");
        if (hud) hud.style.display = "none";
    }

    showPickupEffect(type) {
        const hud = document.getElementById("hud-message");
        if (!hud) return;

        hud.innerText = `Picked ${type}!`;
        hud.style.opacity = 1;

        setTimeout(() => {
            hud.style.opacity = 0;
        }, 1000);
    }
}
