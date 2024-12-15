export class SelectPosition {
    constructor(gameUX) {
        this.selectSavedPositionButton = null;
        this.selectSavedPositionDialog = null;
        this.select = null;
        this.gameUX = gameUX;
        this.selectSavedPositionButton = gameUX.get("selectSavedPositionButton", "button");
        this.selectSavedPositionDialog = gameUX.get("selectSavedPositionDialog", "dialog");
        this.select = this.selectSavedPositionDialog?.querySelector("select");
    }
    getSavedPositions(specifications) {
        const select = this.select;
        if (!select)
            return;
        select.innerHTML = "";
        specifications.map((entry, i) => {
            let opt = document.createElement("option");
            opt.value = String(i);
            opt.innerHTML = entry.name;
            select.append(opt);
        });
    }
    addEvents() {
        const selectPosition = this;
        const gameUX = this.gameUX;
        const dialog = this.selectSavedPositionDialog;
        const button = this.selectSavedPositionButton;
        if (!dialog || !button)
            return;
        const specificationInput = gameUX.get("selectSpecification");
        const confirm = dialog.querySelector('.confirm');
        if (!confirm || !specificationInput)
            return;
        let specifications;
        button.addEventListener('click', function (e) {
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
                }
                else {
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
