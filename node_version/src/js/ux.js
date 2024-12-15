import { GameUX } from "./gameux.js";
import { Message } from "./components/message.js";
import { Board } from "./components/board.js";
import { Flip } from "./components/flip.js";
import { Resign } from "./components/resign.js";
import { Specification } from "./components/specification.js";
import { Record } from "./components/record.js";
import { Result } from "./components/result.js";
import { ScoreBoard } from "./components/scoreboard.js";
import { Copy } from "./components/copy.js";
import { SelectPosition } from "./components/selectposition.js";
import { PositionSetup } from "./components/positionsetup.js";
import { PositionForm } from "./components/positionform.js";
import { Save } from "./components/save.js";
import { Analyze } from "./components/analyze.js";
import { PlacePool } from "./components/placepool.js";
import { Pool } from "./components/pool.js";
import { ManageGame } from "./components/managegame.js";
const componentSpecs = [
    {
        name: 'message',
        tagName: 'div',
        typeName: Message
    },
    {
        name: 'board',
        tagName: 'svg',
        typeName: Board
    },
    {
        name: 'flip',
        tagName: 'button',
        typeName: Flip
    },
    {
        name: 'resign',
        tagName: 'button',
        typeName: Resign
    },
    {
        name: 'result',
        tagName: 'div',
        typeName: Result
    },
    {
        name: 'scoreboard',
        tagName: 'div',
        typeName: ScoreBoard
    },
    {
        name: 'record',
        tagName: 'div',
        typeName: Record
    },
    {
        name: 'copy',
        tagName: 'button',
        typeName: Copy
    },
    {
        name: "selectPosition",
        tagName: "span",
        typeName: SelectPosition
    },
    {
        name: 'positionSetup',
        tagName: 'div',
        typeName: PositionSetup
    },
    {
        name: 'positionForm',
        tagName: 'form',
        typeName: PositionForm
    },
    {
        name: 'specification',
        tagName: 'input',
        typeName: Specification
    },
    {
        name: 'save',
        tagName: 'button',
        typeName: Save
    },
    {
        name: 'analyze',
        tagName: 'a',
        typeName: Analyze
    },
    {
        name: "pool",
        tagName: "table",
        typeName: Pool
    },
    {
        name: "placePool",
        tagName: "button",
        typeName: PlacePool
    },
    {
        name: "manageGame",
        tagName: "",
        typeName: ManageGame
    }
];
export const createGameUX = function (divID, options) {
    const div = document.querySelector(`div#${divID}`);
    if (!div) {
        throw `Div element ${divID} does not exist.`;
    }
    const gameUX = new GameUX(div, options);
    for (const spec of componentSpecs) {
        gameUX.addComponent(spec);
    }
    initComponents(gameUX);
    return gameUX;
};
const initComponents = function (gameUX) {
    for (const component of Object.values(gameUX.components)) {
        if (typeof component.setup === "function") {
            component.setup();
        }
        if (typeof component.update === "function") {
            component.update();
        }
        if (typeof component.addEvents === "function") {
            component.addEvents();
        }
    }
};
