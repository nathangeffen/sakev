import { loadPosition, loadEmptyPosition, newGameWithMoves } from "../game.js";
export class PositionForm {
    constructor(gameUX, form) {
        this.positionSetupDiv = null;
        this.gameUX = gameUX;
        this.form = form;
        const positionSetup = gameUX.components['positionSetup'];
        if (positionSetup) {
            this.positionSetupDiv = positionSetup.div;
            this.positionSetupDiv.style.visibility = "hidden";
        }
    }
    createPosition(formData) {
        const gameUX = this.gameUX;
        const files = Number(formData.get('files'));
        const ranks = Number(formData.get('ranks'));
        let specification = String(formData.get('selectSpecification'));
        let position;
        if (specification !== null && specification > "") {
            position = loadPosition(specification);
        }
        else {
            position = loadEmptyPosition(files, ranks);
        }
        gameUX.game = newGameWithMoves(position);
        gameUX.components['board']?.setup();
        gameUX.update();
    }
    addEvents() {
        const positionForm = this;
        const positionSetupDiv = this.positionSetupDiv;
        const gameUX = this.gameUX;
        this.form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!positionSetupDiv)
                return;
            const formData = new FormData(positionForm.form);
            positionForm.createPosition(formData);
            positionForm.form.style.display = "none";
            positionSetupDiv.style.visibility = "visible";
        });
    }
}
