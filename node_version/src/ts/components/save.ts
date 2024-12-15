import {
  GameUX
} from "../gameux.js";

import {
  Specification
} from "../components/specification.js";

export class Save {
  gameUX: GameUX;
  button: HTMLButtonElement;

  constructor(gameUX: GameUX, button: HTMLButtonElement) {
    this.gameUX = gameUX;
    this.button = button;
  }

  addEvents(this: Save) {
    const specification = this.gameUX.components['specification'] as Specification;
    if (!specification) return;

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


