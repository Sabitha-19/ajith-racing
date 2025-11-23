export default class TouchControls {
constructor() {
this.forward = false;
this.left = false;
this.right = false;
this.#setupKeyboard();
}


#setupKeyboard() {
window.addEventListener("keydown", (e) => {
if (e.code === "ArrowUp") this.forward = true;
if (e.code === "ArrowLeft") this.left = true;
if (e.code === "ArrowRight") this.right = true;
});


window.addEventListener("keyup", (e) => {
if (e.code === "ArrowUp") this.forward = false;
if (e.code === "ArrowLeft") this.left = false;
if (e.code === "ArrowRight") this.right = false;
});
}
}
