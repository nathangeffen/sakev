export class Analyze {
    constructor(gameUX, button) {
        this.gameUX = gameUX;
        this.button = button;
    }
    addEvents() {
        const specification = this.gameUX.components['specification'];
        if (!specification)
            return;
        this.button.addEventListener("click", (event) => {
            event.preventDefault();
            const url = `/analyze/?position=${encodeURIComponent(specification.input.value)}`;
            document.location.href = url;
        });
    }
}
