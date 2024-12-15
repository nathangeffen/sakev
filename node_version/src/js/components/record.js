import { NORTH, toString } from "../game.js";
export class Record {
    constructor(gameUX, div) {
        this.gameUX = gameUX;
        this.div = div;
    }
    update() {
        this.div.innerHTML = "";
        this.gameUX.game.history.head().traverse((position) => {
            const elem = document.createElement('a');
            elem.setAttribute('href', '#');
            let text;
            if (position.move) {
                if (position.side === NORTH) {
                    text = String(1 + Math.floor(position.ply / 2)) + ' ' +
                        toString(position.move);
                    elem.setAttribute('class', 'south');
                }
                else {
                    text = toString(position.move);
                    elem.setAttribute('class', 'north');
                }
                elem.textContent = text;
                this.div.appendChild(elem);
            }
        });
    }
}
