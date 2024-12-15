import { expect, test } from "vitest";
import { dbGetPoolEntryForSession, dbRemoveFromPool, dbPlaceInPool, dbClearPool, dbGetPoolEntries, dbCreatePosition } from "./server.js";
test("Test place, get remove pool entry", () => {
    const entry = {
        session: "abc",
        name: "DEFAULT",
        gameRequested: false
    };
    dbRemoveFromPool("abc");
    let row = dbGetPoolEntryForSession("abc");
    expect(row).toStrictEqual(undefined);
    dbPlaceInPool(entry);
    row = dbGetPoolEntryForSession("abc");
    expect(row.position_id).toStrictEqual(1);
});
test("Test get pool entries", () => {
    dbClearPool();
    let rows = dbGetPoolEntries();
    expect(rows.length).toStrictEqual(0);
    let session = "session" + String(Date.now());
    const name = "pos" + String(Date.now());
    const specification = "spec" + String(Date.now());
    dbCreatePosition(name, specification);
    const entry = {
        session: session,
        name: "DEFAULT",
        gameRequested: false
    };
    dbPlaceInPool(entry);
    session = "session" + String(Date.now() + 1);
    entry.session = session;
    entry.name = name;
    dbPlaceInPool(entry);
    rows = dbGetPoolEntries();
    expect(rows.length).toStrictEqual(2);
});
