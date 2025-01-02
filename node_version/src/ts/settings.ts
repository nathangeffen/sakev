import { db } from "./server.js";

const dbGetSetting = (key: string) => {
  const row: any = db.prepare(`
                        SELECT value
                        FROM   settings
                        WHERE  key = ?
                `).get(key);
  return row?.value || null;
}

const dbSetSetting = (key: string, value: string) => {
  db.prepare(`INSERT INTO settings(key, value) VALUES (?, ?)`).run(key, value);
}

export const getSetting = (key: string, callback: Function | null = null, update = true) => {
  let value = dbGetSetting(key);
  if (value) return value;
  if (callback) {
    value = callback();
    if (update) {
      dbSetSetting(key, value);
    }
  }
  return value;
}

export const dbRemoveSetting = (key: string) => {
  db.prepare(`
            DELETE
            FROM settings
            WHERE key = ?
  `).run(key);
}
