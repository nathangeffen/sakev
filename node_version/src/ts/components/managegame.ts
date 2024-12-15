import {
  move as gameMove, SOUTH, NORTH, GameStatus, GameOverReason,
  move
} from "../game.js";

import {
  TransmitMove, RESIGN
} from "../common.js";

import {
  GameUX,
  GameUXState
} from "../gameux.js";

import {
  Board
} from "../components/board.js";

const isItMe = function(sideNum: number, sideString: string) {
  if (sideNum === SOUTH && sideString.toLowerCase() === "south")
    return true;
  if (sideNum === NORTH && sideString.toLowerCase() === "north")
    return true;
  return false;
}

export class ManageGame {
  gameUX: GameUX;
  board: Board | null;
  plySync: number = 0;

  constructor(gameUX: GameUX) {
    this.gameUX = gameUX;
    this.board = gameUX.components["board"];
    this.setMessage(isItMe(gameUX.game.position.side, gameUX.options.thisSide));
    if (gameUX.options.thisSide.toLowerCase() === "north") {
      const board = gameUX.components['board'] as Board;
      if (!board) return;
      gameUX.onTop = SOUTH;
      board.redraw();
    }
  }

  setMessage = function(this: ManageGame, myTurn: boolean) {
    const message = this.gameUX.components['message'];
    if (!message || this.gameUX.inplay === false) return;
    const opponentMessage = myTurn ? "" : "opponent's";
    if (this.gameUX.game.position.gameStatus === GameStatus.InPlay) {
      message.set(`You are ${this.gameUX.options.thisSide}.
                     It's your ${opponentMessage} turn to play.`);
    } else {
      message.set("");
    }
  }

  update = function(this: ManageGame) {
    if (!this.board) return;
    const gameUX = this.gameUX;
    const position = this.gameUX.game.position;
    if (gameUX.inplay === true) {
      if (this.plySync !== position.ply - 1) return;
      ++this.plySync;
      const transmitMove: TransmitMove = {
        gameId: gameUX.gameId,
        transmitter: gameUX.options.thisSide,
        ply: position.ply,
        move: position.move
      };
      gameUX.socket.emit("game", transmitMove);
      this.setMessage(false);
    }
  }

  addEvents = function(this: ManageGame) {
    const manageGame = this;
    const gameUX = this.gameUX;
    // HandleEvent to receive move, then inc plySent and plyReceived
    gameUX.socket.on(`g-${this.gameUX.gameId}`, (moveDetails: TransmitMove) => {
      const position = gameUX.game.position;
      if (moveDetails.move === null && moveDetails.ply === RESIGN) {
        position.gameStatus = (moveDetails.transmitter.toLowerCase() === "south")
          ? GameStatus.North : GameStatus.South;
        position.gameOverReason = GameOverReason.Resignation;
        const message = gameUX.components['message'];
        if (message) message.set("");
        gameUX.gameUXState = GameUXState.GameOver;
        gameUX.update();
        return;
      }
      // TO DO: Handle draw offers and acceptance
      if (manageGame.plySync !== moveDetails.ply - 1 || moveDetails.move === null) return;
      try {
        gameMove(gameUX.game, moveDetails.move);
        gameUX.gameUXState = GameUXState.WaitingUser;
        ++manageGame.plySync;
        manageGame.setMessage(true);
        gameUX.update();
      } catch (err) {
        alert("Error receiving move");
      }
    });
  }
}
