export class Save {
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
            fetch("/saveposition", {
                method: "POST",
                body: JSON.stringify({
                    specification: specification.input.value
                }),
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            })
                .then((response) => response.json())
                .then((json) => {
                this.gameUX.components['message'].set(json.message, 0);
            });
        });
    }
}
