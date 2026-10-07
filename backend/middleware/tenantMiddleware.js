import { tenantStorage } from "../config/tenantDb.js";

export const tenantMiddleware = (req, res, next) => {
  if (req.user && req.user._id) {
    tenantStorage.run({ tenantId: req.user._id.toString() }, next);
  } else {
    next();
  }
};
