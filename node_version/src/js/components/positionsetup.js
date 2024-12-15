import { SOUTH, NORTH, SI, fr, ROOK, BISHOP } from "../game.js";
export class PositionSetup {
    constructor(gameUX, div) {
        this.action = "cursor";
        this.setInitialSelectedToCursor = function () {
            const pointer = this.div.querySelector('button.cursor');
            if (!pointer)
                return;
            pointer.dispatchEvent(new MouseEvent("click", {
                view: window,
                bubbles: true,
                cancelable: true,
            }));
        };
        this.addButtonEvents = function () {
            const positionSetup = this;
            const buttons = this.div.querySelectorAll('div.setup-board-buttons button');
            const selected = this.div.querySelector("div.selected");
            if (!selected)
                return;
            buttons.forEach((button) => {
                button.addEventListener('click', function (e) {
                    e.preventDefault();
                    selected.innerHTML = button.innerHTML;
                    selected.style.backgroundColor = getComputedStyle(button).getPropertyValue('background-color');
                    positionSetup.action = button.dataset.action || "cursor";
                });
            });
            this.setInitialSelectedToCursor();
        };
        this.addFormEvents = function () {
            const positionSetup = this;
            this.sideToPlay?.addEventListener('change', function () {
                const position = positionSetup.gameUX.game.position;
                position.side = (positionSetup.sideToPlay?.value === 'south') ? SOUTH : NORTH;
                positionSetup.gameUX.components['specification']?.update();
            });
            this.startScoreSouth?.addEventListener('change', function () {
                const position = positionSetup.gameUX.game.position;
                position.startScore[SI(SOUTH)] = Number(positionSetup.startScoreSouth?.value);
                positionSetup.gameUX.components['specification']?.update();
            });
            this.startScoreNorth?.addEventListener('change', function () {
                const position = positionSetup.gameUX.game.position;
                position.startScore[SI(NORTH)] = Number(positionSetup.startScoreNorth?.value);
                positionSetup.gameUX.components['specification']?.update();
            });
            this.winScoreSouth?.addEventListener('change', function () {
                const position = positionSetup.gameUX.game.position;
                position.winScore[SI(SOUTH)] = Number(positionSetup.winScoreSouth?.value);
                positionSetup.gameUX.components['specification']?.update();
            });
            this.winScoreNorth?.addEventListener('change', function () {
                const position = positionSetup.gameUX.game.position;
                position.winScore[SI(NORTH)] = Number(positionSetup.winScoreNorth?.value);
                positionSetup.gameUX.components['specification']?.update();
            });
            this.ply?.addEventListener('change', function () {
                const position = positionSetup.gameUX.game.position;
                position.ply = Number(positionSetup.ply?.value);
                positionSetup.gameUX.components['specification']?.update();
            });
            this.plyWhenLastPointsScored?.addEventListener('change', function () {
                const position = positionSetup.gameUX.game.position;
                position.plyLastPoints = Number(positionSetup.plyWhenLastPointsScored?.value);
                positionSetup.gameUX.components['specification']?.update();
            });
            this.plyCountWithoutPointsTillEnd?.addEventListener('change', function () {
                const position = positionSetup.gameUX.game.position;
                position.plyTillEnd = Number(positionSetup.plyCountWithoutPointsTillEnd?.value);
                positionSetup.gameUX.components['specification']?.update();
            });
            this.canMoveBackToLastMoveSquare?.addEventListener('change', function () {
                const position = positionSetup.gameUX.game.position;
                position.repeatLastMove = positionSetup.canMoveBackToLastMoveSquare.checked;
                positionSetup.gameUX.components['specification']?.update();
            });
        };
        this.addEvents = function () {
            this.addButtonEvents();
            this.addFormEvents();
        };
        this.update = function () {
            const position = this.gameUX.game.position;
            this.gameUX.gameUXState = 0 /* GameUXState.SettingUp */;
            if (this.sideToPlay) {
                this.sideToPlay.value = (position.side === SOUTH) ? "south" : "north";
            }
            if (this.startScoreSouth) {
                this.startScoreSouth.value = String(position.score[SI(SOUTH)]);
            }
            if (this.startScoreNorth) {
                this.startScoreNorth.value = String(position.score[SI(NORTH)]);
            }
            if (this.winScoreSouth) {
                this.winScoreSouth.value = String(position.winScore[SI(SOUTH)]);
            }
            if (this.winScoreNorth) {
                this.winScoreNorth.value = String(position.winScore[SI(NORTH)]);
            }
            if (this.ply) {
                this.ply.value = String(position.ply);
            }
            if (this.plyWhenLastPointsScored) {
                this.plyWhenLastPointsScored.value = String(position.plyLastPoints);
            }
            if (this.plyCountWithoutPointsTillEnd) {
                this.plyCountWithoutPointsTillEnd.value = String(position.plyTillEnd);
            }
            if (this.canMoveBackToLastMoveSquare) {
                this.canMoveBackToLastMoveSquare.checked = position.repeatLastMove;
            }
        };
        this.setSquare = function (file, rank) {
            const position = this.gameUX.game.position;
            const action = this.action;
            const square = position.squares[fr(position.files, file, rank)];
            switch (action) {
                case 'north-rook':
                    square.piece = [0, ROOK];
                    break;
                case 'north-bishop':
                    square.piece = [0, BISHOP];
                    break;
                case 'south-rook':
                    square.piece = [ROOK, 0];
                    break;
                case 'south-bishop':
                    square.piece = [BISHOP, 0];
                    break;
                case 'north-0':
                    square.points[1] = 0;
                    break;
                case 'north-1':
                    square.points[1] = 1;
                    break;
                case 'north-2':
                    square.points[1] = 2;
                    break;
                case 'north-3':
                    square.points[1] = 3;
                    break;
                case 'north-4':
                    square.points[1] = 4;
                    break;
                case 'south-0':
                    square.points[0] = 0;
                    break;
                case 'south-1':
                    square.points[0] = 1;
                    break;
                case 'south-2':
                    square.points[0] = 2;
                    break;
                case 'south-3':
                    square.points[0] = 3;
                    break;
                case 'south-4':
                    square.points[0] = 4;
                    break;
                case 'block':
                    square.blocked = true;
                    break;
                case 'eraser':
                    square.piece = [0, 0];
                    square.points = [0, 0];
                    square.blocked = false;
                    break;
            }
            this.gameUX.components['specification']?.update();
        };
        this.gameUX = gameUX;
        this.div = div;
        this.sideToPlay = div.querySelector('select[name="side-to-play"]');
        this.startScoreSouth = div.querySelector('input[name="start-score-south"]');
        this.startScoreNorth = div.querySelector('input[name="start-score-north"]');
        this.winScoreSouth = div.querySelector('input[name="win-score-south"]');
        this.winScoreNorth = div.querySelector('input[name="win-score-north"]');
        this.ply = div.querySelector('input[name="ply"]');
        this.plyWhenLastPointsScored = div.querySelector('input[name="ply-last"]');
        this.plyCountWithoutPointsTillEnd = div.querySelector('input[name="ply-count"]');
        this.canMoveBackToLastMoveSquare = div.querySelector('input[name="repeat"]');
    }
}
