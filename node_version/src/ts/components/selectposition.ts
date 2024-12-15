import {
  Position, loadPosition, loadEmptyPosition,
  newGameWithMoves
} from "../game.js";

import {
  GameUX
} from "../gameux.js";

export class SelectPosition {
  gameUX: GameUX;
  selectSavedPositionButton: HTMLButtonElement | null = null;
  selectSavedPositionDialog: HTMLDialogElement | null = null;
  select: HTMLSelectElement | null = null;

  constructor(gameUX: GameUX) {
    this.gameUX = gameUX;
    this.selectSavedPositionButton = gameUX.get("selectSavedPositionButton", "button") as HTMLButtonElement;
    this.selectSavedPositionDialog = gameUX.get("selectSavedPositionDialog", "dialog") as HTMLDialogElement;
    this.select = this.selectSavedPositionDialog?.querySelector("select") as HTMLSelectElement;
  }


  getSavedPositions(this: SelectPosition,
    specifications: { name: string, specification: string }[]) {
    const select = this.select;
    if (!select) return;
    select.innerHTML = "";
    specifications.map((entry: any, i: number) => {
      let opt = document.createElement("option");
      opt.value = String(i);
      opt.innerHTML = entry.name;
      select.append(opt);
    });
  }

  addEvents(this: SelectPosition) {
    const selectPosition = this;
    const gameUX = this.gameUX;

    const dialog = this.selectSavedPositionDialog;
    const button = this.selectSavedPositionButton;
    if (!dialog || !button) return;

    const specificationInput = gameUX.get("selectSpecification") as HTMLInputElement;
    const confirm = dialog.querySelector('.confirm') as HTMLButtonElement;
    if (!confirm || !specificationInput) return;

    let specifications: { name: string, specification: string }[];

    button.addEventListener('click', function(e) {
      e.preventDefault();
      fetch('/loadpositions', {
        method: "GET",
        headers: {
          "Content-type": "application/json; charset=UTF-8"
        }
      }).then((response) => response.json())
        .then((json) => {
          specifications = json;
          selectPosition.getSavedPositions(specifications);
        })
        .then(() => {
          if (specifications.length > 0) {
            dialog.show();
          } else {
            alert("There are currently no saved positions.");
          }
        });
    });

    confirm.addEventListener("click", (e) => {
      e.preventDefault();
      const index = this.select?.selectedIndex || 0;
      dialog.close(specifications[index].name);
    });

    dialog.addEventListener("close", () => {
      const specificationName = dialog.returnValue;
      specificationInput.value = specificationName;
    });

  }

}



