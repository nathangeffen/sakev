import { RESIGN } from "../common.js";
import { GameStatus } from "../game.js";
export class Resign {
    constructor(gameUX, button) {
        this.update = function () {
            if (this.gameUX.game.position.gameStatus !== GameStatus.InPlay) {
                this.button.style.display = "none";
            }
        };
        this.addEvents = function () {
            const gameUX = this.gameUX;
            this.button.addEventListener('click', function (e) {
                e.preventDefault();
                if (gameUX.game.position.gameStatus !== GameStatus.InPlay)
                    return;
                if (window.confirm("Are you sure you wish to resign?") === false)
                    return;
                const transmitMove = {
                    gameId: gameUX.gameId,
                    transmitter: gameUX.options.thisSide,
                    ply: RESIGN,
                    move: null
                };
                gameUX.socket.emit("game", transmitMove);
            });
        };
        this.gameUX = gameUX;
        this.button = button;
    }
}
