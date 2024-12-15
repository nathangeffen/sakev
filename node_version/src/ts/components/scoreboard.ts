
import {
  SOUTH, NORTH, SI
} from "../game.js";

import {
  GameUX
} from "../gameux.js";


export class ScoreBoard {
  gameUX: GameUX;
  div: HTMLDivElement;

  constructor(gameUX: GameUX, div: HTMLDivElement) {
    this.gameUX = gameUX;
    this.div = div;
  }

  update(this: ScoreBoard) {
    const div = this.div;
    const gameUX = this.gameUX;
    const position = gameUX.game.position;
    const plyLeft = div.querySelector('div.ply-left');
    if (plyLeft) {
      plyLeft.textContent = `Ply till result: ${(position.plyTillEnd - (position.ply - position.plyLastPoints))}`;
    }

    const score = div.querySelector('div.score');
    if (!score) return;

    const southScore = position.score[SI(SOUTH)];
    const northScore = position.score[SI(NORTH)];
    const southToWin = Math.max(0, position.winScore[SI(SOUTH)] - southScore);
    const northToWin = Math.max(0, position.winScore[SI(NORTH)] - northScore);
    const southDiv = div.querySelector('div.south-score');
    if (southDiv) {
      southDiv.textContent = `South score: ${southScore} To win: ${southToWin}`;
    }
    const northDiv = div.querySelector('div.north-score');
    if (northDiv) {
      northDiv.textContent = `North score: ${northScore} To win: ${northToWin}`;
    }
  }
}


