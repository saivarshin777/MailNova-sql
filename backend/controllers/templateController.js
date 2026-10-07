import Template from "../models/Template.js";

const canSeeGlobalWorkspace = (req) => ["Admin", "Manager"].includes(req.user?.role);
const scopeTemplateFilter = (req, filter = {}) =>
  canSeeGlobalWorkspace(req)
    ? filter
    : {
        ...filter,
        $or: [{ createdBy: req.user?._id }, { createdBy: null }, { createdBy: { $exists: false } }],
      };

const scopeOwnedTemplateFilter = (req, filter = {}) =>
  canSeeGlobalWorkspace(req) ? filter : { ...filter, createdBy: req.user?._id };

export const getTemplates = async (req, res, next) => {
  try {
    const templates = await Template.find({
      ...scopeTemplateFilter(req),
      createdBy: { $ne: null },
    }).sort({ updatedAt: -1 }).lean();
    res.json(templates);
  } catch (error) {
    next(error);
  }
};

export const getTemplate = async (req, res, next) => {
  try {
    const template = await Template.findOne(scopeTemplateFilter(req, { _id: req.params.id })).lean();
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    res.json(template);
  } catch (error) {
    next(error);
  }
};

export const createTemplate = async (req, res, next) => {
  try {
    const template = await Template.create({
      name: req.body.name?.trim() || "Untitled Template",
      subject: req.body.subject?.trim() || "",
      templateType: req.body.templateType?.trim() || "Custom",
      background: req.body.background || "#f8fafc",
      accentColor: req.body.accentColor || "#2563eb",
      customLogo: req.body.customLogo || "",
      blocks: Array.isArray(req.body.blocks) ? req.body.blocks : [],
      htmlContent: req.body.htmlContent || req.body.html || "",
      textContent: req.body.textContent || "",
      createdBy: req.user?._id,
    });
    res.status(201).json(template);
  } catch (error) {
    next(error);
  }
};

export const updateTemplate = async (req, res, next) => {
  try {
    const template = await Template.findOneAndUpdate(
      scopeOwnedTemplateFilter(req, { _id: req.params.id }),
      {
        name: req.body.name?.trim() || "Untitled Template",
        subject: req.body.subject?.trim() || "",
        templateType: req.body.templateType?.trim() || "Custom",
        background: req.body.background || "#f8fafc",
        accentColor: req.body.accentColor || "#2563eb",
        customLogo: req.body.customLogo || "",
        blocks: Array.isArray(req.body.blocks) ? req.body.blocks : [],
        htmlContent: req.body.htmlContent || req.body.html || "",
        textContent: req.body.textContent || "",
      },
      { new: true, runValidators: true }
    );
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    res.json(template);
  } catch (error) {
    next(error);
  }
};

export const deleteTemplate = async (req, res, next) => {
  try {
    const template = await Template.findOneAndDelete(scopeOwnedTemplateFilter(req, { _id: req.params.id }));
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    next(error);
  }
};
