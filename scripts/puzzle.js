export default class Puzzle {
    constructor(onComplete) {
        this.onComplete = onComplete;

        this.element = document.createElement("div");
        this.element.style.position = "absolute";
        this.element.style.left = "50%";
        this.element.style.top = "50%";
        this.element.style.transform = "translate(-50%, -50%)";
        this.element.style.padding = "20px";
        this.element.style.background = "white";
        this.element.style.borderRadius = "10px";
        this.element.innerHTML = `
            <h2>Solve to Start</h2>
            <p>5 + 7 = ?</p>
            <input id="pAnswer" style="width:100%;padding:10px;font-size:20px;">
            <button id="pCheck" style="margin-top:10px;padding:10px;width:100%;">Submit</button>
        `;

        document.body.appendChild(this.element);

        document.getElementById("pCheck").onclick = () => {
            const ans = document.getElementById("pAnswer").value;
            if (ans == 12) {
                this.finish();
            }
        };
    }

    finish() {
        this.element.remove();
        this.onComplete();
    }
}
