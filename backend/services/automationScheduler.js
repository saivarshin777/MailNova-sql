import { runGlobally } from "../config/tenantDb.js";
import {
  processDueAutomationTasks,
  sweepInactiveContacts,
  sweepUnopenedCampaigns,
} from "./automationEngine.js";

const SWEEP_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes

const runSweepForAllTenants = async () => {
  try {
    await runGlobally(async (user) => {
      const actorId = user._id;
      // Each sweep is isolated per tenant and per sweep type - one tenant's
      // (or one sweep's) failure must never stop the others from running.
      await processDueAutomationTasks(actorId).catch((error) =>
        console.error(`[automation scheduler] processDueAutomationTasks failed for ${user.email}:`, error.message)
      );
      await sweepInactiveContacts(actorId).catch((error) =>
        console.error(`[automation scheduler] sweepInactiveContacts failed for ${user.email}:`, error.message)
      );
      await sweepUnopenedCampaigns(actorId).catch((error) =>
        console.error(`[automation scheduler] sweepUnopenedCampaigns failed for ${user.email}:`, error.message)
      );
    });
  } catch (error) {
    console.error("[automation scheduler] sweep run failed:", error.message);
  }
};

export const startAutomationScheduler = () => {
  // Run once shortly after startup, then on a fixed interval. unref() so
  // this timer never keeps the process alive on its own (matches the
  // pattern already used for rate-limiter cleanup).
  setTimeout(runSweepForAllTenants, 15_000).unref();
  setInterval(runSweepForAllTenants, SWEEP_INTERVAL_MS).unref();
  console.log(`[automation scheduler] started - sweeping every ${SWEEP_INTERVAL_MS / 60000} minutes`);
};
