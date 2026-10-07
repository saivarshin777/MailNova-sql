import { AsyncLocalStorage } from "node:async_hooks";

// Holds { tenantId } for the current request / background job.
// (Same object the app already used; it now lives here so the SQL layer and
// config/tenantDb.js can both import it without a circular dependency.)
export const tenantStorage = new AsyncLocalStorage();
