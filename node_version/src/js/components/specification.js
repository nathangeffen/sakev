import { positionToString } from "../game.js";
// import {
//   Board
// } from "./board.js";
export class Specification {
    constructor(gameUX, input) {
        this.gameUX = gameUX;
        this.input = input;
    }
    update() {
        this.input.value = positionToString(this.gameUX.game.position);
    }
}
