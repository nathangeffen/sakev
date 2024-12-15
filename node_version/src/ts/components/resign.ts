import {
  TransmitMove, RESIGN
} from "../common.js";
import { GameStatus } from "../game.js";

import {
  GameUX
} from "../gameux.js";

export class Resign {
  gameUX: GameUX;
  button: HTMLButtonElement;

  constructor(gameUX: GameUX, button: HTMLButtonElement) {
    this.gameUX = gameUX;
    this.button = button;
  }

  update = function(this: Resign) {
    if (this.gameUX.game.position.gameStatus !== GameStatus.InPlay) {
      this.button.style.display = "none";
    }
  }

  addEvents = function(this: Resign) {
    const gameUX = this.gameUX;
    this.button.addEventListener('click', function(e) {
      e.preventDefault();
      if (gameUX.game.position.gameStatus !== GameStatus.InPlay) return;
      if (window.confirm("Are you sure you wish to resign?") === false) return;
      const transmitMove: TransmitMove = {
        gameId: gameUX.gameId,
        transmitter: gameUX.options.thisSide,
        ply: RESIGN,
        move: null
      };
      gameUX.socket.emit("game", transmitMove);
    });
  }
}

