import {
  Position, NORTH, toString
} from "../game.js";

import {
  GameUX
} from "../gameux.js";

export class Record {
  gameUX: GameUX;
  div: HTMLDivElement;

  constructor(gameUX: GameUX, div: HTMLDivElement) {
    this.gameUX = gameUX;
    this.div = div;
  }

  update(this: Record) {
    this.div.innerHTML = "";
    this.gameUX.game.history.head().traverse((position: Position) => {
      const elem = document.createElement('a');
      elem.setAttribute('href', '#');
      let text: string;
      if (position.move) {
        if (position.side === NORTH) {
          text = String(1 + Math.floor(position.ply / 2)) + ' ' +
            toString(position.move);
          elem.setAttribute('class', 'south');
        } else {
          text = toString(position.move);
          elem.setAttribute('class', 'north');
        }
        elem.textContent = text;
        this.div.appendChild(elem);
      }
    });
  }
}


