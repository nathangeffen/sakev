export class PoolTable {
    constructor(gameUX, button) {
        this.socket = io();
        this.specificationName = "DEFAULT";
        this.gameRequested = false;
        this.gameUX = gameUX;
        this.button = button;
    }
    addEvents() {
        const placePool = this;
        this.button.addEventListener('click', function (e) {
            e.preventDefault();
            placePool.gameRequested = !placePool.gameRequested;
            placePool.socket.emit("placePool", {
                id: placePool.socket.id,
                specificatioName: placePool.specificationName,
                gameRequested: placePool.gameRequested
            });
            if (placePool.gameRequested === true) {
                placePool.button.textContent = "Enter playing pool";
            }
            else {
                placePool.button.textContent = "Leave playing pool";
            }
        });
        this.socket.on('placePool', (msg) => {
            console.log("Received on client:", msg);
        });
    }
}
