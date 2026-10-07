/**
 * SQLite driver loader.
 *
 * Uses `better-sqlite3` when it is installed, otherwise falls back to the
 * `node:sqlite` module built into Node 22.5+. Both expose the same
 * prepare().run/get/all API, so the rest of the code does not care which one
 * is active.
 */
import fs from "node:fs";
import path from "node:path";

let db = null;
let driverName = null;
const statementCache = new Map();

export const openDatabase = async (file) => {
  if (db) return db;

  if (file !== ":memory:") {
    fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  }

  try {
    const mod = await import("better-sqlite3");
    const Database = mod.default || mod;
    db = new Database(file);
    driverName = "better-sqlite3";
  } catch (betterErr) {
    try {
      const { DatabaseSync } = await import("node:sqlite");
      db = new DatabaseSync(file);
      driverName = "node:sqlite";
    } catch (nodeErr) {
      throw new Error(
        "No SQLite driver available. Run `npm install` (installs better-sqlite3) " +
          "or use Node.js 22.5 or newer (built-in node:sqlite). " +
          `Details: ${betterErr.message} / ${nodeErr.message}`
      );
    }
  }

  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA synchronous = NORMAL");
  db.exec("PRAGMA busy_timeout = 5000");
  return db;
};

export const getDb = () => {
  if (!db) throw new Error("Database is not open yet. Call connectDB() first.");
  return db;
};

export const getDriverName = () => driverName;

export const closeDatabase = () => {
  if (db) {
    db.close();
    db = null;
    statementCache.clear();
  }
};

const prepare = (sql) => {
  let stmt = statementCache.get(sql);
  if (!stmt) {
    if (statementCache.size > 500) statementCache.clear();
    stmt = getDb().prepare(sql);
    statementCache.set(sql, stmt);
  }
  return stmt;
};

export const run = (sql, params = []) => prepare(sql).run(...params);
export const all = (sql, params = []) => prepare(sql).all(...params).map((row) => ({ ...row }));
export const get = (sql, params = []) => {
  const row = prepare(sql).get(...params);
  return row ? { ...row } : undefined;
};
export const exec = (sql) => getDb().exec(sql);
