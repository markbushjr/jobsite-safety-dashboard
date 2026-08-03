import mongoose from "mongoose";

// A single OSHA-style checklist line item within an inspection.
// e.g. "Fall protection in use above 6 ft", "PPE worn on site", etc.
const checklistItemSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pass", "fail", "n/a"],
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

export default checklistItemSchema;
