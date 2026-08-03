import mongoose from "mongoose";
import checklistItemSchema from "./ChecklistItem.js";
import violationSchema from "./Violation.js";

const inspectionSchema = new mongoose.Schema(
  {
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site",
      required: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The week this inspection covers, e.g. "2026-08-03".
    // Stored as a date representing the start of the inspection week.
    weekOf: {
      type: Date,
      required: true,
    },
    checklist: {
      type: [checklistItemSchema],
      default: [],
    },
    violations: {
      type: [violationSchema],
      default: [],
    },
    // Computed at save-time: "compliant" if no failed checklist items
    // and no open violations, otherwise "non-compliant".
    overallStatus: {
      type: String,
      enum: ["compliant", "non-compliant"],
      default: "compliant",
    },
  },
  { timestamps: true }
);

// Auto-compute overallStatus any time an inspection is saved, so the
// dashboard can query on it directly instead of recalculating every time.
inspectionSchema.pre("save", function (next) {
  const hasFailedItem = this.checklist.some((item) => item.status === "fail");
  const hasOpenViolation = this.violations.some((v) => v.status === "open");
  this.overallStatus = hasFailedItem || hasOpenViolation ? "non-compliant" : "compliant";
  next();
});

const Inspection = mongoose.model("Inspection", inspectionSchema);

export default Inspection;
