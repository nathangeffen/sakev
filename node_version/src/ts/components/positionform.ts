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
    const createGame = function() {
      gameUX.game = newGameWithMoves(position);
      gameUX.components['board']?.setup();
      gameUX.update();
    }
    const gameUX = this.gameUX;
    const files: number = Number(formData.get('files'));
    const ranks: number = Number(formData.get('ranks'));
    let specificationName: string = String(formData.get('selectSpecification'));
    let position: Position;

    if (specificationName !== null && specificationName > "") {
      fetch("/getspecification", {
        method: "POST",
        headers: {
          "Content-type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify({
          name: specificationName
        })
      }).then((response) => response.json()).
        then((specification) => {
          position = loadPosition(specification);
          createGame();
        });
    } else {
      position = loadEmptyPosition(files, ranks);
      createGame();
    }
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


