import {
  GameUX
} from "../gameux.js";

export class Copy {
  gameUX: GameUX;
  button: HTMLButtonElement;

  constructor(gameUX: GameUX, button: HTMLButtonElement) {
    this.gameUX = gameUX;
    this.button = button;
  }

  addEvents(this: Copy) {
    const gameUX = this.gameUX;
    const specification = gameUX.components['specification'];
    if (!specification) return;

    this.button.addEventListener('click', function(e) {
      e.preventDefault();
      navigator.clipboard.writeText(specification.input.value);
      const message = gameUX.components['message'];
      if (message) message.set("Copied!", 1000);
    });
  }
}


