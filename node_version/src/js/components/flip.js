import { SOUTH, NORTH } from "../game.js";
export class Flip {
    constructor(gameUX, button) {
        this.gameUX = gameUX;
        this.button = button;
    }
    addEvents() {
        const gameUX = this.gameUX;
        this.button.addEventListener('click', function (e) {
            e.preventDefault();
            const board = gameUX.components['board'];
            if (!board)
                return;
            gameUX.onTop = (gameUX.onTop === SOUTH) ? NORTH : SOUTH;
            board.redraw();
        });
    }
}
