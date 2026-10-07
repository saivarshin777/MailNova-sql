import { tenantStorage } from "../db/context.js";

// The old app opened one MongoDB database per user. With SQL there is a single
// database and every tenant table carries a tenant_id column; the model layer
// (db/orm.js) reads the current tenant from this AsyncLocalStorage store.
export { tenantStorage };

/**
 * Runs `callback(user)` once per user inside that user's tenant context.
 * Used by background jobs (automation scheduler, admin overview).
 */
export const runGlobally = async (callback) => {
  const { default: User } = await import("../models/User.js");
  const users = await User.find().lean();
  const results = [];
  for (const user of users) {
    const data = await tenantStorage.run({ tenantId: user._id.toString() }, () => callback(user));
    results.push({ user, data });
  }
  return results;
};
