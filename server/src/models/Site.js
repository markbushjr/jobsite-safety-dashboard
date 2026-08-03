import mongoose from "mongoose";

const siteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    // A site can have one or more supervisors responsible for inspections there.
    supervisors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive", "completed"],
      default: "active",
    },
    // Every site expects one inspection per week. Used by the dashboard
    // to calculate whether a site is overdue for its current week.
    inspectionFrequencyDays: {
      type: Number,
      default: 7,
    },
  },
  { timestamps: true }
);

const Site = mongoose.model("Site", siteSchema);

export default Site;
