import {
  PoolEntry
} from "../common.js";

import {
  GameUX
} from "../gameux.js";



export class Pool {
  gameUX: GameUX;
  table: HTMLTableElement;
  poolEntry: PoolEntry

  constructor(gameUX: GameUX, table: HTMLTableElement) {
    this.gameUX = gameUX;
    this.table = table;
    this.poolEntry = {
      session: "0",
      name: "DEFAULT",
      gameRequested: false
    }
  }

  setEntries = function(this: Pool, entries: PoolEntry[], session: string) {
    const tbody = this.table.querySelector('tbody');
    if (!tbody) return;
    tbody.innerHTML = "";
    entries.map((entry: PoolEntry) => {
      if (session === entry.session) return;
      let tr = document.createElement("tr");
      tr.classList.add('pool-entry');
      let tdLeft = document.createElement("td");
      tdLeft.innerText = entry.session;
      let tdRight = document.createElement("td");
      tdRight.innerText = entry.name;
      tbody.append(tr);
      tr.append(tdLeft);
      tr.append(tdRight);
      tr.addEventListener('click', (event) => {
        event.preventDefault();
        tr.querySelectorAll("td").forEach((td: HTMLTableCellElement) => {
          this.gameUX.components['placePool'].chooseOpponent(td.innerText);
        });
      });
    });
  }
}


