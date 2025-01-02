import { port, app, server, io, db } from "./server.js";
import './accounts.js';
import { DEFAULT_POSITION_STRING } from './game.js';
import { PoolEntry, GameDetails, TransmitMove } from "./common.js";
import { GameUXState } from './gameux.js';

app.get('/', (_, res) => {
        res.render('index.html', { title: 'Home' });
})

app.get('/findopponent', (_, res) => {
        res.render('findopponent.html', { title: 'Find opponent' });
});

app.get('/play', (req, res) => {
        const gameUXState: GameUXState = (req.query.side === 'S') ? GameUXState.WaitingUser : GameUXState.WaitingOtherPlayer;
        const game: any = dbGetGame(Number(req.query.game));
        const side = (req.query.side === 'S') ? 'South' : 'North';
        res.render('play.html', {
                startPosition: game.specification,
                gameUXState: gameUXState,
                south: game.south,
                north: game.north,
                thisSide: side,
                gameId: game.rowid,
                flip: true,
                draw: false,
                resign: true
        });
});

app.get('/analyze', (req, res) => {
        res.render('analyze.html', {
                startPosition: (req.query.position) ? req.query.position : DEFAULT_POSITION_STRING,
                flip: true
        });
});

app.get('/position', (_, res) => {
        let positionSpecifications: String[] = [];
        res.render('position.html', {
                title: 'Setup a position',
                positionSpecifications: positionSpecifications
        });
});


app.get('/loadpositions', (_, res) => {
        res.json(dbAllPositions());
});

app.post('/getspecification', (req, res) => {
        res.json(dbGetSpecificationUsingName(req.body.name));
});

app.post('/saveposition', (req, res) => {

        const specification = req.body['specification'];

        const hashSpecification = function() {
                let hashAddress = 0;
                for (let counter = 0; counter < specification.length; counter++) {
                        hashAddress = specification.charCodeAt(specification[counter]) +
                                (hashAddress << 6) + (hashAddress << 16) - hashAddress;
                }
                return hashAddress;
        }

        const generateUniqueName = function() {
                const millisecondsSince20241117 = Number(new Date()) - 1731801600000;
                const hash = hashSpecification();
                return `${millisecondsSince20241117}-${hash}`;
        }

        const uniqueName = generateUniqueName();

        let message: string;
        try {
                dbCreatePosition(uniqueName, specification);
                message = `Position saved: ${uniqueName}`;
        } catch (error: any) {
                message = `An error occurred: ${error}`;
        }
        res.json({ 'message': message });
});

app.get('/getposition', (req, res) => {


});


export const dbDeleteExpiredGameSearch = () => {
        db.prepare("DELETE FROM gamesearch WHERE created <= datetime('now','-5 minute')").run();
}

export const dbAllPositions = () => {
        return db.prepare("SELECT name, specification FROM position").all();
}

export const dbGetSpecificationUsingName = (name: string) => {
        const row: any = db.prepare(`
                SELECT specification FROM position
                WHERE name = ?`).get(name);
        return row?.specification;
}

export const dbCreatePosition = function(name: string, specification: string) {
        db.prepare("INSERT INTO position(name, specification) VALUES(?,?)").
                run(name, specification);
}

export const dbClearPool = function() {
        db.prepare("DELETE FROM gamesearch").run();
}

export const dbPlaceInPool = function(poolEntry: PoolEntry) {
        let positionId = 1;
        if (poolEntry.name !== "DEFAULT") {
                const row: any = db.prepare(
                        "SELECT rowid FROM position WHERE name = ?").
                        get(poolEntry.name);
                positionId = row.rowid;
        }
        db.prepare("INSERT INTO gamesearch (session, position_id) VALUES(?, ?)").
                run(poolEntry.session, positionId);
}

export const dbRemoveFromPool = function(session: string) {
        db.prepare("DELETE FROM gamesearch WHERE session = ?").
                run(session);
}

const handlePoolEntry = function(poolEntry: PoolEntry) {
        if (poolEntry.gameRequested === true) {
                dbRemoveFromPool(poolEntry.session);
                dbPlaceInPool(poolEntry);
        } else {
                dbRemoveFromPool(poolEntry.session);
        }
}

export const dbGetPoolEntries = function() {
        const rows: any = db.prepare(`
                SELECT A.session, B.name
                FROM gameSearch A, position B
                WHERE A.position_id = B.rowid
                        AND A.created > datetime('now','-3 minute')`)
                .all();
        return rows;
}

export const dbGetPoolEntryForSession = function(session: string) {
        const row: any = db.prepare(`
                SELECT  A.session, A.position_id, B.specification
                FROM    gamesearch A, position B
                WHERE   A.session = ? AND
                        B.rowid = A.position_id AND
                        A.created > datetime('now','-3 minute')`).
                get(session);
        return row;
}

export const dbCreateGame = function(gameDetails: GameDetails): GameDetails {
        const result = structuredClone(gameDetails);
        db.prepare(`
                INSERT INTO game (south, north, start_position_id)
                VALUES(?, ?, ?)
                `).
                run(gameDetails.south, gameDetails.north, gameDetails.positionId);
        const id: any = db.prepare("SELECT last_insert_rowid()").get();
        result.id = id['last_insert_rowid()'];
        result.south += String(gameDetails.id);
        result.north += String(gameDetails.id);
        db.prepare(`
                UPDATE game
                SET south = ?, north = ?
                WHERE rowid = ?
                `).
                run(result.south, result.north, result.id);
        return result;
}

export const dbGetGame = function(id: number) {
        const row = db.prepare(`
                        SELECT  A.rowid, A.south, A.north, B.name, B.specification
                        FROM    game A, position B
                        WHERE   A.rowid = ? AND
                                B.rowid = A.start_position_id
                `).get(id);
        return row;
}

io.on('connection', (socket) => {
        socket.on('placePool', (entry: PoolEntry) => {
                let entries: any;
                (async () => {
                        handlePoolEntry(entry);
                        entries = dbGetPoolEntries();
                })().then(() => {
                        io.emit('placePool', entries);
                });
        });

        socket.on('chooseopponent', (players: string[]) => {
                const row = dbGetPoolEntryForSession(players[1]);
                if (!row) return;
                dbRemoveFromPool(players[0]);
                dbRemoveFromPool(players[1]);
                let gameDetails: GameDetails = {
                        id: 0,
                        name: row.name,
                        positionId: row.position_id,
                        specification: row.specification,
                        side: "S",
                        south: "g-",
                        north: "g-"
                };
                gameDetails = dbCreateGame(gameDetails);
                io.emit(players[0], gameDetails);
                gameDetails.side = "N";
                io.emit(players[1], gameDetails);
        });

        socket.on("game", (transmitMove: TransmitMove) => {
                io.emit(`g-${transmitMove.gameId}`, transmitMove);
        });

        socket.on('disconnect', () => {
                const poolEntry: PoolEntry = {
                        session: socket.id,
                        name: "DEFAULT",
                        gameRequested: false
                };
                (async () =>
                        dbRemoveFromPool(poolEntry.session))();
        });
});

setInterval(() => {
        (async () => {
                dbDeleteExpiredGameSearch();
        })().then(() => {
                io.emit('placePool', dbGetPoolEntries());
        });
}, 10000);

app.use((_, res, __) => {
        res.status(404).send(
                "<h1>Page not found</h1>")
})

if (port !== 0) {
        server.listen(port, () => {
                console.log(`server running at http://localhost:${port}`);
        });
}

