import { GameStatus, GameOverReason } from "../game.js";
const reasonText = function (reason, ply) {
    switch (reason) {
        case GameOverReason.Agreement:
            return "Draw agreed";
        case GameOverReason.NoMoves:
            return "No moves possible";
        case GameOverReason.PlyWithoutPoints:
            return `No points scored for ${ply} ply`;
        case GameOverReason.PointsScored:
            return "Winning points scored";
        case GameOverReason.Resignation:
            return "Resignation";
        default:
            return "";
    }
};
export class Result {
    constructor(gameUX, div) {
        this.gameUX = gameUX;
        this.div = div;
    }
    update() {
        const div = this.div;
        const position = this.gameUX.game.position;
        switch (position.gameStatus) {
            case GameStatus.Tie:
                div.textContent = `Game tied: ${reasonText(position.gameOverReason, position.plyTillEnd)}`;
                break;
            case GameStatus.North:
                div.textContent = `North wins: ${reasonText(position.gameOverReason, position.plyTillEnd)}`;
                break;
            case GameStatus.South:
                div.textContent = `South wins: ${reasonText(position.gameOverReason, position.plyTillEnd)}`;
                break;
        }
    }
}
