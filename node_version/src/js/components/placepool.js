export class PlacePool {
    constructor(gameUX, button) {
        this.specificationName = "DEFAULT";
        this.gameRequested = false;
        this.chooseOpponent = function (opponentId) {
            this.gameUX.socket.emit('chooseopponent', [this.gameUX.socket.id, opponentId]);
        };
        this.getSpecificationName = function () {
            const specificationInput = this.gameUX.get("selectSpecification");
            if (specificationInput && specificationInput.value)
                return specificationInput.value;
            return "DEFAULT";
        };
        this.addEvents = function () {
            const placePool = this;
            this.button.addEventListener('click', function (e) {
                e.preventDefault();
                placePool.gameRequested = !placePool.gameRequested;
                placePool.specificationName = placePool.getSpecificationName();
                const poolEntry = {
                    session: placePool.gameUX.socket.id,
                    name: placePool.specificationName,
                    gameRequested: placePool.gameRequested
                };
                placePool.gameUX.socket.emit("placePool", poolEntry);
                if (placePool.gameRequested === true) {
                    placePool.button.textContent = "Leave playing pool";
                }
                else {
                    placePool.button.textContent = "Enter playing pool";
                }
            });
            this.gameUX.socket.on('placePool', (entries) => {
                console.log("Entries:", entries);
                this.gameUX.components['pool'].setEntries(entries, this.gameUX.socket.id);
            });
            this.gameUX.socket.on("connect", () => {
                this.gameUX.socket.on(this.gameUX.socket.id, (gameDetails) => {
                    let url;
                    const side = gameDetails.side;
                    url = `/play?game=${String(gameDetails.id)}&side=${side}`;
                    document.location.href = url;
                });
            });
        };
        this.gameUX = gameUX;
        this.button = button;
    }
}
