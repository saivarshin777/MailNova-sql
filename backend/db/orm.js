/**
 * MailNova SQL model layer.
 *
 * A small, dependency-free replacement for the parts of Mongoose that this app
 * uses, backed by SQLite. Controllers, services and routes call it exactly the
 * way they called Mongoose:
 *
 *   await Contact.find({ status: "Lead" }).sort({ createdAt: -1 }).lean();
 *   const doc = await Campaign.findById(id); doc.status = "Sent"; await doc.save();
 *
 * Supported: find / findOne / findById / countDocuments / create / insertMany /
 * updateOne / updateMany / deleteOne / deleteMany / findOneAndUpdate /
 * findByIdAndUpdate / findOneAndDelete / findByIdAndDelete / exists / aggregate
 * (match, group, sort, limit), query chaining (sort, skip, limit, select,
 * populate, lean), update operators ($set $unset $inc $push $addToSet $pull)
 * and filter operators ($or $and $nor $eq $ne $gt $gte $lt $lte $in $nin
 * $exists $regex $not), plus per-user multi-tenancy.
 *
 * Multi-tenancy: the old app used one Mongo database per user. Here every
 * tenant model has a tenant_id column. The current tenant comes from
 * tenantStorage (set by the auth middleware); with no tenant, rows with
 * tenant_id IS NULL are used (the old "main database").
 */
import crypto from "node:crypto";
import { tenantStorage } from "./context.js";
import { all, exec, get, getDb, run } from "./driver.js";

export const registry = new Map();

export const newId = () => crypto.randomBytes(12).toString("hex"); // 24-char hex, ObjectId-shaped

/* ------------------------------------------------------------------ errors */

export class ValidationError extends Error {
  constructor(message, errors = {}) {
    super(message);
    this.name = "ValidationError";
    this.errors = errors;
  }
}

const duplicateKeyError = (original) => {
  const err = new Error(`E11000 duplicate key error: ${original.message}`);
  err.name = "MongoServerError";
  err.code = 11000;
  err.cause = original;
  return err;
};

const mapDbError = (err) => {
  if (err && /UNIQUE constraint failed/i.test(String(err.message))) return duplicateKeyError(err);
  return err;
};

/* ----------------------------------------------------------------- helpers */

const idOf = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "object" && !(value instanceof Date) && value._id != null) return String(value._id);
  return String(value);
};

const getPath = (obj, path) =>
  path.split(".").reduce((acc, key) => (acc === null || acc === undefined ? undefined : acc[key]), obj);

const setPath = (obj, path, value) => {
  const keys = path.split(".");
  let target = obj;
  for (let i = 0; i < keys.length - 1; i += 1) {
    if (target[keys[i]] === null || typeof target[keys[i]] !== "object") target[keys[i]] = {};
    target = target[keys[i]];
  }
  target[keys[keys.length - 1]] = value;
};

const clone = (value) => {
  if (value instanceof Date) return new Date(value.getTime());
  if (Array.isArray(value)) return value.map(clone);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clone(v)]));
  }
  return value;
};

const qid = (name) => `"${String(name).replace(/"/g, '""')}"`;

const toDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new ValidationError(`Cast to date failed for value "${value}"`);
  return date;
};

const toBool = (value) => {
  if (typeof value === "string") return !["false", "0", "no", ""].includes(value.trim().toLowerCase());
  return Boolean(value);
};

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date) && !(value instanceof RegExp);

const isOperatorObject = (value) => {
  if (!isPlainObject(value)) return false;
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => key.startsWith("$"));
};

/* ------------------------------------------------------------ field system */

const normalizeField = (path, def) => {
  const spec = typeof def === "string" ? { type: def } : { ...def };
  const field = {
    path,
    column: path.replace(/\./g, "_"),
    type: spec.type || "string",
    of: spec.of || "string",
    ref: spec.ref || null,
    required: Boolean(spec.required),
    enum: spec.enum || null,
    trim: Boolean(spec.trim),
    lowercase: Boolean(spec.lowercase),
    min: spec.min,
    unique: Boolean(spec.unique),
    index: Boolean(spec.index),
    hasDefault: Object.prototype.hasOwnProperty.call(spec, "default"),
    default: spec.default,
    normalize: spec.normalize || null,
  };
  if (field.type === "array" && !field.hasDefault) {
    field.hasDefault = true;
    field.default = () => [];
  }
  return field;
};

const defaultFor = (field) => {
  if (!field.hasDefault) return undefined;
  return typeof field.default === "function" ? field.default() : clone(field.default);
};

const coerceElement = (field, value) => {
  if (field.of === "ref") return idOf(value);
  if (field.of === "string") return String(value);
  return value;
};

/** Convert a JS value to the canonical in-memory form for a field (setters). */
const coerce = (field, value) => {
  if (value === null || value === undefined) return null;
  switch (field.type) {
    case "string": {
      let text = String(value);
      if (field.trim) text = text.trim();
      if (field.lowercase) text = text.toLowerCase();
      return text;
    }
    case "ref":
      return idOf(value);
    case "number": {
      const number = Number(value);
      if (Number.isNaN(number)) throw new ValidationError(`Cast to Number failed for path "${field.path}"`);
      return number;
    }
    case "boolean":
      return toBool(value);
    case "date":
      return toDate(value);
    case "array": {
      const list = (Array.isArray(value) ? value : [value]).map((item) => coerceElement(field, item));
      return field.normalize ? field.normalize(list) : list;
    }
    default:
      return value; // mixed
  }
};

const encode = (field, value) => {
  if (value === null || value === undefined) return null;
  switch (field.type) {
    case "boolean":
      return value ? 1 : 0;
    case "date":
      return value.toISOString();
    case "number":
      return Number(value);
    case "array":
    case "mixed":
      return JSON.stringify(value);
    default:
      return String(value);
  }
};

const decode = (field, stored) => {
  if (stored === null || stored === undefined) {
    return field.hasDefault && field.default === null ? null : undefined;
  }
  switch (field.type) {
    case "boolean":
      return Boolean(stored);
    case "date":
      return new Date(stored);
    case "number":
      return Number(stored);
    case "array":
    case "mixed":
      try {
        return JSON.parse(stored);
      } catch {
        return field.type === "array" ? [] : {};
      }
    default:
      return String(stored);
  }
};

/** Normalise a value used inside a query filter into its SQL-comparable form. */
const toSqlParam = (value) => {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "bigint") return Number(value);
  return value;
};

const normalizeQueryValue = (field, value) => {
  if (value === undefined || value === null) return null;
  if (!field) return toSqlParam(value);
  switch (field.type) {
    case "date":
      return toDate(typeof value === "number" || typeof value === "string" ? new Date(value) : value).toISOString();
    case "boolean":
      return toBool(value) ? 1 : 0;
    case "number":
      return Number(value);
    case "ref":
      return idOf(value);
    case "string": {
      let text = String(value);
      if (field.trim) text = text.trim();
      if (field.lowercase) text = text.toLowerCase();
      return text;
    }
    case "array":
      return Array.isArray(value) ? value.map((item) => coerceElement(field, item)) : coerceElement(field, value);
    default:
      return isPlainObject(value) ? JSON.stringify(value) : toSqlParam(value);
  }
};

/* ------------------------------------------------------ select / projection */

const parseSelect = (select) => {
  if (!select) return null;
  const include = new Set();
  const exclude = new Set();
  if (typeof select === "string") {
    select
      .split(/\s+/)
      .filter(Boolean)
      .forEach((token) => {
        if (token.startsWith("-")) exclude.add(token.slice(1));
        else include.add(token.replace(/^\+/, ""));
      });
  } else if (typeof select === "object") {
    Object.entries(select).forEach(([key, flag]) => (flag ? include : exclude).add(key));
  }
  if (include.size === 0 && exclude.size === 0) return null;
  return { include, exclude };
};

const projectionAllows = (projection, path) => {
  if (!projection) return true;
  const top = path.split(".")[0];
  const hit = (set) => set.has(path) || set.has(top);
  if (projection.include.size > 0) return hit(projection.include);
  return !hit(projection.exclude);
};

/* ------------------------------------------------------ row <-> data helpers */

const rowToData = (model, row, projection) => {
  const data = {};
  if (!projection || !(projection.exclude.has("_id") && projection.include.size === 0)) data._id = row._id;
  for (const field of model.fields) {
    if (!projectionAllows(projection, field.path)) continue;
    const value = decode(field, row[field.column]);
    if (value !== undefined) setPath(data, field.path, value);
  }
  return data;
};

const snapshotFromRow = (model, row, projection) => {
  const snapshot = {};
  for (const field of model.fields) {
    if (!projectionAllows(projection, field.path)) continue;
    snapshot[field.column] = row[field.column] === undefined ? null : row[field.column];
  }
  return snapshot;
};

const validateValues = (model, entries) => {
  const errors = {};
  for (const [field, value] of entries) {
    if (field.required && (value === null || value === undefined || value === "")) {
      errors[field.path] = `Path \`${field.path}\` is required.`;
      continue;
    }
    if (value === null || value === undefined) continue;
    if (field.enum && !field.enum.includes(value)) {
      errors[field.path] = `\`${value}\` is not a valid enum value for path \`${field.path}\`.`;
    }
    if (field.min !== undefined && typeof value === "number" && value < field.min) {
      errors[field.path] = `Path \`${field.path}\` (${value}) is less than minimum allowed value (${field.min}).`;
    }
  }
  const messages = Object.values(errors);
  if (messages.length) throw new ValidationError(`${model.name} validation failed: ${messages.join(", ")}`, errors);
};

/** Build a complete, validated data object for a brand-new row. */
const buildData = (model, input = {}, { timestamps = true } = {}) => {
  const data = { _id: input._id != null ? idOf(input._id) : newId() };
  const entries = [];
  for (const field of model.fields) {
    let value = getPath(input, field.path);
    if (value === undefined) value = defaultFor(field);
    if (value === undefined) continue;
    const coerced = coerce(field, value);
    setPath(data, field.path, coerced);
    entries.push([field, coerced]);
  }
  if (model.timestamps && timestamps) {
    const now = new Date();
    if (data.createdAt == null) data.createdAt = now;
    if (data.updatedAt == null) data.updatedAt = now;
  }
  validateValues(
    model,
    model.fields.map((field) => [field, getPath(data, field.path)])
  );
  return data;
};

/** Diff current document data against the snapshot taken when it was loaded. */
const computeChanges = (model, data, snapshot, { validate = true } = {}) => {
  const changed = {};
  const entries = [];
  for (const field of model.fields) {
    let value = getPath(data, field.path);
    const loaded = Object.prototype.hasOwnProperty.call(snapshot, field.column);
    if (value === undefined) {
      if (!loaded) continue;
      value = null;
    } else {
      value = coerce(field, value);
    }
    const encoded = encode(field, value);
    if (!loaded || snapshot[field.column] !== encoded) {
      changed[field.column] = encoded;
      entries.push([field, value]);
    }
  }
  if (validate) validateValues(model, entries);
  return changed;
};

/* ----------------------------------------------------------- query compiler */

const regexCondition = (column, source, params) => {
  let text = String(source);
  let anchoredStart = false;
  let anchoredEnd = false;
  if (text.startsWith("^")) {
    anchoredStart = true;
    text = text.slice(1);
  }
  if (text.endsWith("$") && !text.endsWith("\\$")) {
    anchoredEnd = true;
    text = text.slice(0, -1);
  }
  const literal = text.replace(/\\(.)/g, "$1");
  const escaped = literal.replace(/[\\%_]/g, (m) => `\\${m}`);
  params.push(`${anchoredStart ? "" : "%"}${escaped}${anchoredEnd ? "" : "%"}`);
  return `${column} LIKE ? ESCAPE '\\'`;
};

const equalityCondition = (field, column, value, params, negate) => {
  const normalized = normalizeQueryValue(field, value);
  if (normalized === null) return negate ? `${column} IS NOT NULL` : `${column} IS NULL`;

  if (field?.type === "array" && !Array.isArray(value)) {
    params.push(normalized);
    const exists = `EXISTS (SELECT 1 FROM json_each(${column}) WHERE value = ?)`;
    return negate ? `NOT ${exists}` : exists;
  }
  params.push(Array.isArray(normalized) ? JSON.stringify(normalized) : normalized);
  return negate ? `(${column} IS NULL OR ${column} != ?)` : `${column} = ?`;
};

const inCondition = (field, column, list, params, negate) => {
  const values = (Array.isArray(list) ? list : [list]).map((item) => normalizeQueryValue(field, item));
  const hasNull = values.some((v) => v === null);
  const concrete = values.filter((v) => v !== null);

  if (field?.type === "array") {
    if (concrete.length === 0 && !hasNull) return negate ? "1" : "0";
    const marks = concrete.map(() => "?").join(",");
    params.push(...concrete);
    const base = concrete.length
      ? `EXISTS (SELECT 1 FROM json_each(${column}) WHERE value IN (${marks}))`
      : "0";
    const withNull = hasNull ? `(${base} OR ${column} IS NULL)` : base;
    return negate ? `NOT ${withNull}` : withNull;
  }

  if (concrete.length === 0 && !hasNull) return negate ? "1" : "0";
  const marks = concrete.map(() => "?").join(",");
  if (negate) {
    const parts = [];
    if (hasNull) parts.push(`${column} IS NOT NULL`);
    else parts.push(`${column} IS NULL`);
    if (concrete.length) {
      params.push(...concrete);
      parts[0] = hasNull ? `(${column} IS NOT NULL AND ${column} NOT IN (${marks}))` : `(${column} IS NULL OR ${column} NOT IN (${marks}))`;
    }
    return parts[0];
  }
  const parts = [];
  if (concrete.length) {
    params.push(...concrete);
    parts.push(`${column} IN (${marks})`);
  }
  if (hasNull) parts.push(`${column} IS NULL`);
  return `(${parts.join(" OR ")})`;
};

const compareCondition = (field, column, operator, value, params) => {
  const normalized = normalizeQueryValue(field, value);
  if (normalized === null) return "0";
  params.push(normalized);
  return `${column} ${operator} ?`;
};

const operatorCondition = (field, column, operator, value, container, params) => {
  switch (operator) {
    case "$eq":
      return equalityCondition(field, column, value, params, false);
    case "$ne":
      return equalityCondition(field, column, value, params, true);
    case "$gt":
      return compareCondition(field, column, ">", value, params);
    case "$gte":
      return compareCondition(field, column, ">=", value, params);
    case "$lt":
      return compareCondition(field, column, "<", value, params);
    case "$lte":
      return compareCondition(field, column, "<=", value, params);
    case "$in":
      return inCondition(field, column, value, params, false);
    case "$nin":
      return inCondition(field, column, value, params, true);
    case "$exists":
      return value ? `${column} IS NOT NULL` : `${column} IS NULL`;
    case "$regex": {
      const source = value instanceof RegExp ? value.source : String(value);
      return regexCondition(column, source, params);
    }
    case "$not": {
      if (value instanceof RegExp) return `NOT (${regexCondition(column, value.source, params)})`;
      return `NOT (${fieldCondition(field, column, value, params)})`;
    }
    default:
      throw new Error(`Unsupported query operator ${operator}`);
  }
};

const fieldCondition = (field, column, raw, params) => {
  if (raw instanceof RegExp) return regexCondition(column, raw.source, params);
  if (isOperatorObject(raw)) {
    const parts = Object.entries(raw)
      .filter(([operator]) => operator !== "$options")
      .map(([operator, value]) => operatorCondition(field, column, operator, value, raw, params));
    return parts.length ? `(${parts.join(" AND ")})` : "1";
  }
  return equalityCondition(field, column, raw, params, false);
};

const compileFilter = (model, filter, params) => {
  const parts = [];
  for (const [key, raw] of Object.entries(filter || {})) {
    if (key === "$or" || key === "$and" || key === "$nor") {
      const subs = (Array.isArray(raw) ? raw : []).map((sub) => compileFilter(model, sub, params));
      if (key === "$or") parts.push(subs.length ? `(${subs.join(" OR ")})` : "0");
      else if (key === "$and") parts.push(subs.length ? `(${subs.join(" AND ")})` : "1");
      else parts.push(subs.length ? `NOT (${subs.join(" OR ")})` : "1");
      continue;
    }
    const field = model.fieldMap.get(key);
    // Unknown fields behave like missing fields in Mongo: they never match a value.
    const column = field ? qid(field.column) : "NULL";
    parts.push(fieldCondition(field, column, raw === undefined ? null : raw, params));
  }
  return parts.length ? parts.join(" AND ") : "1";
};

const buildWhere = (model, tenantId, filter, params) => {
  const parts = [];
  if (model.tenant) {
    if (tenantId) {
      params.push(String(tenantId));
      parts.push(`"tenant_id" = ?`);
    } else {
      parts.push(`"tenant_id" IS NULL`);
    }
  }
  parts.push(compileFilter(model, filter, params));
  return parts.join(" AND ");
};

const compileSort = (model, sort) => {
  const entries = [];
  if (typeof sort === "string") {
    sort
      .split(/\s+/)
      .filter(Boolean)
      .forEach((token) => entries.push(token.startsWith("-") ? [token.slice(1), -1] : [token.replace(/^\+/, ""), 1]));
  } else if (sort && typeof sort === "object") {
    entries.push(...Object.entries(sort));
  }
  const parts = [];
  for (const [key, direction] of entries) {
    const field = model.fieldMap.get(key);
    if (!field) continue;
    const desc = direction === -1 || direction === "desc" || direction === "descending";
    parts.push(`${qid(field.column)} ${desc ? "DESC" : "ASC"}`);
  }
  parts.push("rowid ASC"); // stable, insertion-ordered tie-break (matches Mongo natural order)
  return `ORDER BY ${parts.join(", ")}`;
};

/* ------------------------------------------------------------ SQL operations */

const purgeExpired = (model) => {
  if (!model.ttl) return;
  const cutoff = new Date(Date.now() - model.ttl.seconds * 1000).toISOString();
  run(`DELETE FROM ${qid(model.table)} WHERE ${qid(model.ttl.field)} < ?`, [cutoff]);
};

const selectRows = (model, tenantId, filter, { sort, skip = 0, limit = 0 } = {}) => {
  purgeExpired(model);
  const params = [];
  const where = buildWhere(model, tenantId, filter, params);
  let sql = `SELECT rowid AS "__rowid", * FROM ${qid(model.table)} WHERE ${where} ${compileSort(model, sort)}`;
  if (limit > 0) {
    sql += ` LIMIT ${Math.floor(limit)}`;
    if (skip > 0) sql += ` OFFSET ${Math.floor(skip)}`;
  } else if (skip > 0) {
    sql += ` LIMIT -1 OFFSET ${Math.floor(skip)}`;
  }
  return all(sql, params.map(toSqlParam));
};

const countRows = (model, tenantId, filter) => {
  purgeExpired(model);
  const params = [];
  const where = buildWhere(model, tenantId, filter, params);
  return Number(get(`SELECT COUNT(*) AS n FROM ${qid(model.table)} WHERE ${where}`, params.map(toSqlParam)).n);
};

const insertData = (model, tenantId, data) => {
  const columns = [`_id`];
  const values = [data._id];
  if (model.tenant) {
    columns.push("tenant_id");
    values.push(tenantId ? String(tenantId) : null);
  }
  for (const field of model.fields) {
    columns.push(field.column);
    values.push(encode(field, getPath(data, field.path)));
  }
  try {
    run(
      `INSERT INTO ${qid(model.table)} (${columns.map(qid).join(",")}) VALUES (${columns.map(() => "?").join(",")})`,
      values
    );
  } catch (err) {
    throw mapDbError(err);
  }
};

const updateColumns = (model, tenantId, id, changed) => {
  const columns = Object.keys(changed);
  if (!columns.length) return;
  const params = columns.map((column) => changed[column]);
  let sql = `UPDATE ${qid(model.table)} SET ${columns.map((c) => `${qid(c)} = ?`).join(", ")} WHERE "_id" = ?`;
  params.push(id);
  if (model.tenant) {
    if (tenantId) {
      sql += ` AND "tenant_id" = ?`;
      params.push(String(tenantId));
    } else {
      sql += ` AND "tenant_id" IS NULL`;
    }
  }
  try {
    run(sql, params);
  } catch (err) {
    throw mapDbError(err);
  }
};

const inTransaction = (fn) => {
  exec("BEGIN");
  try {
    const result = fn();
    exec("COMMIT");
    return result;
  } catch (err) {
    try {
      exec("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw err;
  }
};

/* ----------------------------------------------------------------- Document */

class Document {
  constructor(model, data, snapshot, tenantId) {
    Object.assign(this, data);
    Object.defineProperties(this, {
      $model: { value: model, enumerable: false },
      $snapshot: { value: snapshot, enumerable: false, writable: true },
      $tenantId: { value: tenantId || null, enumerable: false },
    });
  }

  get id() {
    return this._id == null ? undefined : String(this._id);
  }

  get(path) {
    return getPath(this, path);
  }

  set(path, value) {
    if (typeof path === "object" && path) {
      Object.entries(path).forEach(([key, v]) => setPath(this, key, v));
    } else {
      setPath(this, path, value);
    }
    return this;
  }

  markModified() {}

  toObject() {
    return clone({ ...this });
  }

  toJSON() {
    return this.toObject();
  }

  async save() {
    const model = this.$model;
    const changed = computeChanges(model, this, this.$snapshot);
    if (Object.keys(changed).length) {
      if (model.timestamps && !("updatedAt" in changed)) {
        const now = new Date();
        changed.updatedAt = now.toISOString();
        this.updatedAt = now;
      }
      updateColumns(model, this.$tenantId, this._id, changed);
      this.$snapshot = { ...this.$snapshot, ...changed };
    }
    return this;
  }
}

/* -------------------------------------------------------------- update ops */

const assignPath = (model, data, path, value) => {
  if (value === undefined) return;
  const field = model.fieldMap.get(path);
  if (field) {
    setPath(data, path, coerce(field, value));
    return;
  }
  // Whole nested object, e.g. { plan: { name, sendLimit } }
  const subFields = model.fields.filter((f) => f.path.startsWith(`${path}.`));
  if (subFields.length && isPlainObject(value)) {
    for (const sub of subFields) {
      const subValue = getPath(value, sub.path.slice(path.length + 1));
      if (subValue !== undefined) setPath(data, sub.path, coerce(sub, subValue));
    }
  }
};

const mutateArray = (model, data, path, mutator) => {
  const field = model.fieldMap.get(path);
  if (!field || field.type !== "array") return;
  const current = Array.isArray(getPath(data, path)) ? [...getPath(data, path)] : [];
  setPath(data, path, mutator(current, field).map((item) => coerceElement(field, item)));
};

const applyUpdate = (model, data, update = {}) => {
  const direct = {};
  const operators = {};
  for (const [key, value] of Object.entries(update)) {
    if (key.startsWith("$")) operators[key] = value;
    else direct[key] = value;
  }

  Object.entries({ ...direct, ...(operators.$set || {}) }).forEach(([path, value]) => assignPath(model, data, path, value));

  Object.keys(operators.$unset || {}).forEach((path) => {
    const field = model.fieldMap.get(path);
    if (field) setPath(data, path, null);
  });

  Object.entries(operators.$inc || {}).forEach(([path, amount]) => {
    const field = model.fieldMap.get(path);
    if (field) setPath(data, path, Number(getPath(data, path) || 0) + Number(amount));
  });

  Object.entries(operators.$push || {}).forEach(([path, value]) => {
    const items = isPlainObject(value) && Array.isArray(value.$each) ? value.$each : [value];
    mutateArray(model, data, path, (current, field) => [...current, ...items.map((i) => coerceElement(field, i))]);
  });

  Object.entries(operators.$addToSet || {}).forEach(([path, value]) => {
    const items = isPlainObject(value) && Array.isArray(value.$each) ? value.$each : [value];
    mutateArray(model, data, path, (current, field) => {
      for (const item of items) {
        const normalized = coerceElement(field, item);
        if (!current.some((existing) => String(existing) === String(normalized))) current.push(normalized);
      }
      return current;
    });
  });

  Object.entries(operators.$pull || {}).forEach(([path, condition]) => {
    mutateArray(model, data, path, (current, field) => {
      const targets =
        isOperatorObject(condition) && Array.isArray(condition.$in)
          ? condition.$in
          : [condition];
      const remove = new Set(targets.map((t) => String(coerceElement(field, t))));
      return current.filter((existing) => !remove.has(String(existing)));
    });
  });
};

/* ------------------------------------------------------------------- Query */

class Query {
  constructor(model, op, args, tenantId) {
    this.model = model;
    this.op = op;
    this.args = args;
    this.tenantId = tenantId;
    this._sort = null;
    this._skip = 0;
    this._limit = 0;
    this._select = null;
    this._populate = [];
    this._lean = false;
  }

  sort(value) {
    this._sort = value;
    return this;
  }

  skip(value) {
    this._skip = Number(value) || 0;
    return this;
  }

  limit(value) {
    this._limit = Number(value) || 0;
    return this;
  }

  select(value) {
    this._select = value;
    return this;
  }

  populate(path, select) {
    if (path && typeof path === "object") this._populate.push({ path: path.path, select: path.select });
    else this._populate.push({ path, select });
    return this;
  }

  lean(value = true) {
    this._lean = value;
    return this;
  }

  exec() {
    try {
      return Promise.resolve(this._run());
    } catch (err) {
      return Promise.reject(err);
    }
  }

  then(onFulfilled, onRejected) {
    return this.exec().then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this.exec().catch(onRejected);
  }

  finally(onFinally) {
    return this.exec().finally(onFinally);
  }

  /* -- internals -- */

  _populateAll(dataList) {
    for (const { path, select } of this._populate) {
      const field = this.model.fieldMap.get(path);
      if (!field || !field.ref) continue;
      const refModel = registry.get(field.ref);
      if (!refModel) continue;

      const ids = new Set();
      for (const item of dataList) {
        const value = item[path];
        if (Array.isArray(value)) value.forEach((v) => v != null && ids.add(String(v)));
        else if (value != null) ids.add(String(value));
      }
      if (ids.size === 0) continue;

      const projection = parseSelect(select);
      const byId = new Map();
      const idList = [...ids];
      for (let i = 0; i < idList.length; i += 500) {
        const chunk = idList.slice(i, i + 500);
        selectRows(refModel, this.tenantId, { _id: { $in: chunk } }).forEach((row) => {
          byId.set(row._id, rowToData(refModel, row, projection));
        });
      }

      for (const item of dataList) {
        const value = item[path];
        if (Array.isArray(value)) item[path] = value.map((v) => byId.get(String(v))).filter(Boolean);
        else if (value != null) item[path] = byId.get(String(value)) || null;
      }
    }
  }

  _finish(entries) {
    // entries: [{ data, snapshot }]
    this._populateAll(entries.map((e) => e.data));
    return entries.map(({ data, snapshot }) =>
      this._lean ? data : new Document(this.model, data, snapshot, this.tenantId)
    );
  }

  _entriesFromRows(rows) {
    const projection = parseSelect(this._select);
    return rows.map((row) => ({
      data: rowToData(this.model, row, projection),
      snapshot: snapshotFromRow(this.model, row, projection),
    }));
  }

  _run() {
    const { model, tenantId } = this;
    const [filter = {}, update = {}, options = {}] = this.args;

    switch (this.op) {
      case "find": {
        const rows = selectRows(model, tenantId, filter, { sort: this._sort, skip: this._skip, limit: this._limit });
        return this._finish(this._entriesFromRows(rows));
      }
      case "findOne": {
        const rows = selectRows(model, tenantId, filter, { sort: this._sort, skip: this._skip, limit: 1 });
        return rows.length ? this._finish(this._entriesFromRows(rows))[0] : null;
      }
      case "countDocuments":
        return countRows(model, tenantId, filter);
      case "exists": {
        const rows = selectRows(model, tenantId, filter, { limit: 1 });
        return rows.length ? { _id: rows[0]._id } : null;
      }
      case "findOneAndUpdate": {
        const rows = selectRows(model, tenantId, filter, { sort: this._sort, limit: 1 });
        if (!rows.length) return null;
        const row = rows[0];
        const before = rowToData(model, row, null);
        const snapshot = snapshotFromRow(model, row, null);
        const after = clone(before);
        applyUpdate(model, after, update);
        const changed = computeChanges(model, after, snapshot, { validate: Boolean(options.runValidators) });
        if (model.timestamps && options.timestamps !== false && !("updatedAt" in changed)) {
          const now = new Date();
          changed.updatedAt = now.toISOString();
          after.updatedAt = now;
        }
        updateColumns(model, tenantId, row._id, changed);
        const finalSnapshot = { ...snapshot, ...changed };
        return this._finish([{ data: options.new ? after : before, snapshot: options.new ? finalSnapshot : snapshot }])[0];
      }
      case "findOneAndDelete": {
        const rows = selectRows(model, tenantId, filter, { sort: this._sort, limit: 1 });
        if (!rows.length) return null;
        const row = rows[0];
        const entry = this._entriesFromRows([row]);
        updateDelete(model, tenantId, [row._id]);
        return this._finish(entry)[0];
      }
      case "updateOne":
      case "updateMany": {
        const rows = selectRows(model, tenantId, filter, { limit: this.op === "updateOne" ? 1 : 0 });
        let modified = 0;
        inTransaction(() => {
          for (const row of rows) {
            const data = rowToData(model, row, null);
            const snapshot = snapshotFromRow(model, row, null);
            applyUpdate(model, data, update);
            const changed = computeChanges(model, data, snapshot, { validate: Boolean(options.runValidators) });
            if (model.timestamps && options.timestamps !== false && !("updatedAt" in changed)) {
              changed.updatedAt = new Date().toISOString();
            }
            if (Object.keys(changed).length) modified += 1;
            updateColumns(model, tenantId, row._id, changed);
          }
        });
        return { acknowledged: true, matchedCount: rows.length, modifiedCount: modified, upsertedCount: 0 };
      }
      case "deleteOne":
      case "deleteMany": {
        const rows = selectRows(model, tenantId, filter, { limit: this.op === "deleteOne" ? 1 : 0 });
        const deletedCount = updateDelete(model, tenantId, rows.map((r) => r._id));
        return { acknowledged: true, deletedCount };
      }
      default:
        throw new Error(`Unsupported query operation ${this.op}`);
    }
  }
}

const updateDelete = (model, tenantId, ids) => {
  let deleted = 0;
  for (let i = 0; i < ids.length; i += 500) {
    const chunk = ids.slice(i, i + 500);
    const params = [...chunk];
    let sql = `DELETE FROM ${qid(model.table)} WHERE "_id" IN (${chunk.map(() => "?").join(",")})`;
    if (model.tenant) {
      if (tenantId) {
        sql += ` AND "tenant_id" = ?`;
        params.push(String(tenantId));
      } else {
        sql += ` AND "tenant_id" IS NULL`;
      }
    }
    deleted += Number(run(sql, params).changes || 0);
  }
  return deleted;
};

/* --------------------------------------------------------------- aggregate */

const resolveExpression = (expr, doc) => {
  if (typeof expr === "string" && expr.startsWith("$")) return getPath(doc, expr.slice(1));
  return expr;
};

const aggregateRows = (model, tenantId, pipeline) => {
  let docs = null;
  for (const [index, stage] of pipeline.entries()) {
    const [name] = Object.keys(stage);
    const arg = stage[name];

    if (name === "$match") {
      if (index !== 0) throw new Error("$match is only supported as the first aggregate stage");
      docs = selectRows(model, tenantId, arg).map((row) => rowToData(model, row, null));
    } else {
      if (docs === null) docs = selectRows(model, tenantId, {}).map((row) => rowToData(model, row, null));

      if (name === "$group") {
        const groups = new Map();
        for (const doc of docs) {
          const key = resolveExpression(arg._id, doc);
          const mapKey = key instanceof Date ? key.toISOString() : JSON.stringify(key ?? null);
          if (!groups.has(mapKey)) groups.set(mapKey, { key, docs: [] });
          groups.get(mapKey).docs.push(doc);
        }
        docs = [...groups.values()].map(({ key, docs: members }) => {
          const out = { _id: key ?? null };
          for (const [outField, spec] of Object.entries(arg)) {
            if (outField === "_id") continue;
            const [accumulator] = Object.keys(spec);
            const values = members.map((m) => resolveExpression(spec[accumulator], m));
            const numbers = values.map(Number).filter((n) => !Number.isNaN(n));
            switch (accumulator) {
              case "$sum":
                out[outField] = numbers.reduce((a, b) => a + b, 0);
                break;
              case "$avg":
                out[outField] = numbers.length ? numbers.reduce((a, b) => a + b, 0) / numbers.length : null;
                break;
              case "$min":
                out[outField] = numbers.length ? Math.min(...numbers) : null;
                break;
              case "$max":
                out[outField] = numbers.length ? Math.max(...numbers) : null;
                break;
              case "$first":
                out[outField] = values[0] ?? null;
                break;
              case "$push":
                out[outField] = values;
                break;
              default:
                throw new Error(`Unsupported accumulator ${accumulator}`);
            }
          }
          return out;
        });
      } else if (name === "$sort") {
        const keys = Object.entries(arg);
        docs = [...docs].sort((a, b) => {
          for (const [key, direction] of keys) {
            const av = getPath(a, key);
            const bv = getPath(b, key);
            if (av === bv) continue;
            if (av === undefined || av === null) return -direction;
            if (bv === undefined || bv === null) return direction;
            return (av > bv ? 1 : -1) * direction;
          }
          return 0;
        });
      } else if (name === "$limit") {
        docs = docs.slice(0, arg);
      } else {
        throw new Error(`Unsupported aggregate stage ${name}`);
      }
    }
  }
  return docs === null ? selectRows(model, tenantId, {}).map((row) => rowToData(model, row, null)) : docs;
};

/* ------------------------------------------------------------ model factory */

export const defineModel = (name, spec) => {
  const fields = Object.entries(spec.fields).map(([path, def]) => normalizeField(path, def));
  const timestamps = spec.timestamps !== false;
  if (timestamps) {
    fields.push(normalizeField("createdAt", { type: "date" }), normalizeField("updatedAt", { type: "date" }));
  }

  const fieldMap = new Map(fields.map((field) => [field.path, field]));
  fieldMap.set("_id", { path: "_id", column: "_id", type: "ref", of: "ref", hasDefault: false });

  const model = {
    name,
    table: spec.table,
    tenant: Boolean(spec.tenant),
    timestamps,
    fields,
    fieldMap,
    ttl: spec.ttl || null,
    indexes: spec.indexes || [],
  };
  registry.set(name, model);

  const currentTenant = () => (model.tenant ? tenantStorage.getStore()?.tenantId || null : null);
  const query = (op, ...args) => new Query(model, op, args, currentTenant());
  const withSelect = (q, projection) => (projection ? q.select(projection) : q);

  return {
    modelName: name,
    schemaInfo: model,

    find: (filter = {}, projection) => withSelect(query("find", filter), projection),
    findOne: (filter = {}, projection) => withSelect(query("findOne", filter), projection),
    findById: (id, projection) => withSelect(query("findOne", { _id: id }), projection),
    countDocuments: (filter = {}) => query("countDocuments", filter),
    exists: (filter = {}) => query("exists", filter),

    updateOne: (filter, update, options) => query("updateOne", filter, update, options || {}),
    updateMany: (filter, update, options) => query("updateMany", filter, update, options || {}),
    deleteOne: (filter = {}) => query("deleteOne", filter),
    deleteMany: (filter = {}) => query("deleteMany", filter),
    findOneAndUpdate: (filter, update, options) => query("findOneAndUpdate", filter, update, options || {}),
    findByIdAndUpdate: (id, update, options) => query("findOneAndUpdate", { _id: id }, update, options || {}),
    findOneAndDelete: (filter = {}) => query("findOneAndDelete", filter),
    findByIdAndDelete: (id) => query("findOneAndDelete", { _id: id }),

    async create(input, options = {}) {
      const tenantId = currentTenant();
      const many = Array.isArray(input);
      const list = many ? input : [input];
      const docs = inTransaction(() =>
        list.map((item) => {
          const data = buildData(model, item, { timestamps: options.timestamps !== false });
          insertData(model, tenantId, data);
          return new Document(model, data, snapshotFromRow(model, rowFromData(model, tenantId, data), null), tenantId);
        })
      );
      return many ? docs : docs[0];
    },

    async insertMany(input, options = {}) {
      const tenantId = currentTenant();
      return inTransaction(() =>
        (Array.isArray(input) ? input : [input]).map((item) => {
          const data = buildData(model, item, { timestamps: options.timestamps !== false });
          insertData(model, tenantId, data);
          return new Document(model, data, snapshotFromRow(model, rowFromData(model, tenantId, data), null), tenantId);
        })
      );
    },

    async aggregate(pipeline = []) {
      return aggregateRows(model, currentTenant(), pipeline);
    },
  };
};

const rowFromData = (model, tenantId, data) => {
  const row = { _id: data._id };
  for (const field of model.fields) row[field.column] = encode(field, getPath(data, field.path));
  return row;
};

/* ------------------------------------------------------------ schema setup */

const sqlType = (field) => {
  switch (field.type) {
    case "number":
      return "NUMERIC";
    case "boolean":
      return "INTEGER";
    default:
      return "TEXT";
  }
};

/** Create missing tables / columns / indexes for every registered model. */
export const initSchema = () => {
  const db = getDb();
  for (const model of registry.values()) {
    const table = qid(model.table);
    const columns = [`"_id" TEXT PRIMARY KEY`];
    if (model.tenant) columns.push(`"tenant_id" TEXT`);
    for (const field of model.fields) columns.push(`${qid(field.column)} ${sqlType(field)}`);
    db.exec(`CREATE TABLE IF NOT EXISTS ${table} (${columns.join(", ")})`);

    // Forward-compatible: add columns introduced by later model changes.
    const existing = new Set(all(`PRAGMA table_info(${table})`).map((c) => c.name));
    const wanted = [
      ...(model.tenant ? [{ column: "tenant_id", type: "TEXT" }] : []),
      ...model.fields.map((f) => ({ column: f.column, type: sqlType(f) })),
    ];
    for (const col of wanted) {
      if (!existing.has(col.column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${qid(col.column)} ${col.type}`);
    }

    if (model.tenant) {
      db.exec(`CREATE INDEX IF NOT EXISTS ${qid(`${model.table}_tenant_idx`)} ON ${table} ("tenant_id")`);
    }
    for (const field of model.fields) {
      if (field.unique) {
        db.exec(
          `CREATE UNIQUE INDEX IF NOT EXISTS ${qid(`${model.table}_${field.column}_uq`)} ON ${table} (${qid(field.column)})`
        );
      } else if (field.index) {
        db.exec(
          `CREATE INDEX IF NOT EXISTS ${qid(`${model.table}_${field.column}_idx`)} ON ${table} (${qid(field.column)})`
        );
      }
    }
    for (const index of model.indexes) {
      const cols = index.fields.map((f) => qid(model.fieldMap.get(f)?.column || f));
      const name = `${model.table}_${index.fields.join("_")}${index.unique ? "_uq" : "_idx"}`;
      db.exec(`CREATE ${index.unique ? "UNIQUE " : ""}INDEX IF NOT EXISTS ${qid(name)} ON ${table} (${cols.join(", ")})`);
    }
  }
};

export { Document };
