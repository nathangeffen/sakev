import {
  SOUTH, NORTH
} from "../game.js";

import {
  GameUX
} from "../gameux.js";

import {
  Board
} from "./board.js";

export class Flip {
  gameUX: GameUX;
  button: HTMLButtonElement;

  constructor(gameUX: GameUX, button: HTMLButtonElement) {
    this.gameUX = gameUX;
    this.button = button;
  }

  addEvents(this: Flip) {
    const gameUX = this.gameUX;
    this.button.addEventListener('click', function(e) {
      e.preventDefault();
      const board = gameUX.components['board'] as Board;
      if (!board) return;
      gameUX.onTop = (gameUX.onTop === SOUTH) ? NORTH : SOUTH;
      board.redraw();
    });
  }
}
