export class Copy {
    constructor(gameUX, button) {
        this.gameUX = gameUX;
        this.button = button;
    }
    addEvents() {
        const gameUX = this.gameUX;
        const specification = gameUX.components['specification'];
        if (!specification)
            return;
        this.button.addEventListener('click', function (e) {
            e.preventDefault();
            navigator.clipboard.writeText(specification.input.value);
            const message = gameUX.components['message'];
            if (message)
                message.set("Copied!", 1000);
        });
    }
}
