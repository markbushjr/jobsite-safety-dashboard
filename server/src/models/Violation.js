import mongoose from "mongoose";

// A flagged safety violation found during an inspection.
// Tracked separately from checklist items so it can carry a resolution
// workflow (photo evidence, status, resolved date) independent of the
// pass/fail checklist.
const violationSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true,
  },
  severity: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  photoUrl: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ["open", "resolved"],
    default: "open",
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
});

export default violationSchema;
