import {
  Position, loadPosition, loadEmptyPosition,
  newGameWithMoves
} from "../game.js";

import {
  GameUX
} from "../gameux.js";

export class PositionForm {
  gameUX: GameUX;
  form: HTMLFormElement;
  positionSetupDiv: HTMLDivElement | null = null;

  constructor(gameUX: GameUX, form: HTMLFormElement) {
    this.gameUX = gameUX;
    this.form = form;
    const positionSetup = gameUX.components['positionSetup'];
    if (positionSetup) {
      this.positionSetupDiv = positionSetup.div;
      this.positionSetupDiv!.style.visibility = "hidden";
    }
  }


  createPosition(formData: FormData) {
    const gameUX = this.gameUX;
    const files: number = Number(formData.get('files'));
    const ranks: number = Number(formData.get('ranks'));
    let specification: string = String(formData.get('selectSpecification'));
    let position: Position;

    if (specification !== null && specification > "") {
      position = loadPosition(specification);
    } else {
      position = loadEmptyPosition(files, ranks);
    }
    gameUX.game = newGameWithMoves(position);
    gameUX.components['board']?.setup();
    gameUX.update();
  }

  addEvents(this: PositionForm) {
    const positionForm = this;
    const positionSetupDiv = this.positionSetupDiv;
    const gameUX = this.gameUX;

    this.form.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!positionSetupDiv) return;

      const formData = new FormData(positionForm.form);
      positionForm.createPosition(formData);
      positionForm.form.style.display = "none";
      positionSetupDiv.style.visibility = "visible";
    });
  }
}


