import Automation from "../models/Automation.js";
import { recordActivity } from "./activityController.js";

export const getAutomations = async (req, res, next) => {
  try {
    const workflows = await Automation.find({}).sort({ createdAt: -1 }).lean();
    res.json({ success: true, workflows });
  } catch (error) {
    next(error);
  }
};

export const createAutomation = async (req, res, next) => {
  try {
    const { name, trigger, condition, action, folder } = req.body;

    if (!name?.trim() || !trigger || !action) {
      return res.status(400).json({ success: false, message: "Name, trigger, and action are required." });
    }

    const workflow = await Automation.create({
      name: name.trim(),
      trigger,
      condition: condition || "Immediately",
      action,
      folder: folder?.trim() || "All Contacts",
      active: true,
      createdBy: req.user?._id,
    });

    await recordActivity({
      action: "automation.created",
      entityType: "Automation",
      entityId: workflow._id,
      actor: req.user?._id,
      message: `${req.user?.email || "A user"} created automation "${workflow.name}"`,
    });

    res.status(201).json({ success: true, workflow });
  } catch (error) {
    next(error);
  }
};

export const updateAutomation = async (req, res, next) => {
  try {
    const { name, trigger, condition, action, folder } = req.body;
    const workflow = await Automation.findById(req.params.id);

    if (!workflow) {
      return res.status(404).json({ success: false, message: "Automation not found." });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ success: false, message: "Name is required." });
      }
      workflow.name = name.trim();
    }
    if (trigger !== undefined) workflow.trigger = trigger;
    if (condition !== undefined) workflow.condition = condition;
    if (action !== undefined) workflow.action = action;
    if (folder !== undefined) workflow.folder = folder?.trim() || "All Contacts";

    // Editing the trigger/condition changes what this workflow should fire
    // for, so clear its fired-history to avoid silently skipping contacts
    // that would now match under the new rules.
    if (trigger !== undefined || condition !== undefined) {
      workflow.firedForContacts = [];
    }

    await workflow.save();

    await recordActivity({
      action: "automation.updated",
      entityType: "Automation",
      entityId: workflow._id,
      actor: req.user?._id,
      message: `${req.user?.email || "A user"} updated automation "${workflow.name}"`,
    });

    res.json({ success: true, workflow });
  } catch (error) {
    next(error);
  }
};

export const toggleAutomation = async (req, res, next) => {
  try {
    const workflow = await Automation.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ success: false, message: "Automation not found." });
    }

    workflow.active = !workflow.active;
    await workflow.save();

    res.json({ success: true, workflow });
  } catch (error) {
    next(error);
  }
};

export const deleteAutomation = async (req, res, next) => {
  try {
    const workflow = await Automation.findByIdAndDelete(req.params.id);
    if (!workflow) {
      return res.status(404).json({ success: false, message: "Automation not found." });
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
