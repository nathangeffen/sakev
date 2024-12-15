import {
  GameUX
} from "../gameux.js";

import {
  Specification
} from "../components/specification.js";

export class Analyze {
  gameUX: GameUX;
  button: HTMLButtonElement;

  constructor(gameUX: GameUX, button: HTMLButtonElement) {
    this.gameUX = gameUX;
    this.button = button;
  }

  addEvents(this: Analyze) {
    const specification = this.gameUX.components['specification'] as Specification;
    if (!specification) return;

    this.button.addEventListener("click", (event) => {
      event.preventDefault();
      const url = `/analyze/?position=${encodeURIComponent(specification.input.value)}`;
      document.location.href = url;
    });
  }
}


