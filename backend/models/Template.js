import { defineModel } from "../db/orm.js";

const BLOCK_TYPES = [
  "heading",
  "text",
  "button",
  "image",
  "divider",
  "header",
  "paragraph",
  "list",
  "image_placeholder",
  "spacer",
  "quote",
];

// Normalises each block the way the old embedded sub-schema did.
const normalizeBlocks = (blocks) =>
  (Array.isArray(blocks) ? blocks : []).map((block) => {
    const b = block || {};
    return {
      type: BLOCK_TYPES.includes(b.type) ? b.type : "text",
      content: b.content ?? "",
      url: b.url ?? "",
      imageData: b.imageData ?? "",
      height: b.height ?? "",
      align: ["left", "center", "right"].includes(b.align) ? b.align : "left",
    };
  });

const Template = defineModel("Template", {
  table: "templates",
  tenant: true,
  fields: {
    name: { type: "string", required: true, trim: true },
    subject: { type: "string", default: "", trim: true },
    templateType: { type: "string", default: "newsletter", trim: true },
    background: { type: "string", default: "#f8fafc" },
    accentColor: { type: "string", default: "#2563eb" },
    customLogo: { type: "string", default: "" },
    blocks: { type: "array", of: "object", default: () => [], normalize: normalizeBlocks },
    htmlContent: { type: "string", default: "" },
    textContent: { type: "string", default: "" },
    createdBy: { type: "ref", ref: "User", default: null },
  },
  indexes: [{ fields: ["createdBy", "updatedAt"] }],
});

export default Template;
