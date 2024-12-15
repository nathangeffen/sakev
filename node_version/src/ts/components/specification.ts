import {
  positionToString
} from "../game.js";

import {
  GameUX
} from "../gameux.js";

// import {
//   Board
// } from "./board.js";

export class Specification {
  gameUX: GameUX;
  input: HTMLInputElement;

  constructor(gameUX: GameUX, input: HTMLInputElement) {
    this.gameUX = gameUX;
    this.input = input;
  }

  update(this: Specification) {
    this.input.value = positionToString(this.gameUX.game.position);
  }
}

