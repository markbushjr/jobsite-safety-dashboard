// Seeds realistic demo data: 2 supervisors, 4 sites, and several weeks of
// inspection history with a mix of clean weeks, resolved violations, an
// open violation, an overdue site, and a brand-new site with no
// inspections yet -- enough variety for the dashboard charts and KPIs
// to show something meaningful.
//
// Safe to re-run: it clears out only the specific demo records it
// creates (by email/site name) before recreating them, so it won't
// touch your real admin account or any other data.
//
// Run with: npm run seed   (from the server/ folder)

import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";
import Site from "./models/Site.js";
import Inspection from "./models/Inspection.js";
import { DEFAULT_CHECKLIST } from "./seedChecklist.js";

dotenv.config();

const SUPERVISOR_EMAILS = ["jordan.reyes@example.com", "casey.nguyen@example.com"];
const SITE_NAMES = [
  "Riverside Commons - Bldg C",
  "Midtown Tower - Phase 2",
  "Peachtree Industrial Park",
  "Lakeview Business Center",
];
const DEMO_PASSWORD = "Supervisor123!";

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function buildChecklist(failLabels = []) {
  return DEFAULT_CHECKLIST.map((label) => ({
    label,
    status: failLabels.includes(label) ? "fail" : "pass",
    notes: failLabels.includes(label) ? "Flagged during walkthrough." : "",
  }));
}

async function run() {
  await connectDB();

  console.log("Clearing previous demo data...");
  const oldSupervisors = await User.find({ email: { $in: SUPERVISOR_EMAILS } });
  const oldSupervisorIds = oldSupervisors.map((u) => u._id);
  const oldSites = await Site.find({ name: { $in: SITE_NAMES } });
  const oldSiteIds = oldSites.map((s) => s._id);
  await Inspection.deleteMany({ site: { $in: oldSiteIds } });
  await Site.deleteMany({ name: { $in: SITE_NAMES } });
  await User.deleteMany({ email: { $in: SUPERVISOR_EMAILS } });

  console.log("Creating demo supervisors...");
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
  const jordan = await User.create({
    name: "Jordan Reyes",
    email: "jordan.reyes@example.com",
    password: hashedPassword,
    role: "supervisor",
  });
  const casey = await User.create({
    name: "Casey Nguyen",
    email: "casey.nguyen@example.com",
    password: hashedPassword,
    role: "supervisor",
  });

  console.log("Creating demo sites...");
  const riverside = await Site.create({
    name: "Riverside Commons - Bldg C",
    address: "412 Riverside Dr, Atlanta, GA",
    supervisors: [jordan._id],
    inspectionFrequencyDays: 7,
  });
  const midtown = await Site.create({
    name: "Midtown Tower - Phase 2",
    address: "875 W Peachtree St, Atlanta, GA",
    supervisors: [jordan._id],
    inspectionFrequencyDays: 7,
  });
  const peachtree = await Site.create({
    name: "Peachtree Industrial Park",
    address: "2200 Peachtree Industrial Blvd, Norcross, GA",
    supervisors: [casey._id],
    inspectionFrequencyDays: 7,
  });
  await Site.create({
    name: "Lakeview Business Center",
    address: "3390 Peachtree Rd, Duluth, GA",
    supervisors: [casey._id],
    inspectionFrequencyDays: 7,
    // Intentionally left with zero inspections below, to demo the
    // "no inspections yet" overdue state and empty-history handling.
  });

  console.log("Creating inspection history...");

  // Riverside Commons: clean track record, one violation that got
  // caught and resolved a few weeks back.
  for (let weeksBack = 7; weeksBack >= 0; weeksBack -= 1) {
    const inspection = await Inspection.create({
      site: riverside._id,
      submittedBy: jordan._id,
      weekOf: daysAgo(weeksBack * 7),
      checklist: buildChecklist(),
      violations:
        weeksBack === 5
          ? [
              {
                description: "Debris blocking secondary stairwell exit.",
                severity: "medium",
                status: "resolved",
                resolvedAt: daysAgo(weeksBack * 7 - 2),
              },
            ]
          : [],
    });
    await inspection.save(); // re-trigger pre-save hook for overallStatus
  }

  // Midtown Tower: overdue -- most recent inspection is 14 days back,
  // past the 7-day window -- and it left an open high-severity violation.
  for (let weeksBack = 8; weeksBack >= 2; weeksBack -= 1) {
    const isMostRecent = weeksBack === 2;
    const inspection = await Inspection.create({
      site: midtown._id,
      submittedBy: jordan._id,
      weekOf: daysAgo(weeksBack * 7),
      checklist: buildChecklist(
        isMostRecent ? ["Fall protection in use where required (6+ ft)"] : []
      ),
      violations: isMostRecent
        ? [
            {
              description: "Missing guardrails on 3rd floor open edge.",
              severity: "high",
              status: "open",
            },
          ]
        : [],
    });
    await inspection.save();
  }

  // Peachtree Industrial: consistent history, but this week has a
  // fresh open violation -- currently non-compliant.
  for (let weeksBack = 7; weeksBack >= 0; weeksBack -= 1) {
    const isThisWeek = weeksBack === 0;
    const inspection = await Inspection.create({
      site: peachtree._id,
      submittedBy: casey._id,
      weekOf: daysAgo(weeksBack * 7),
      checklist: buildChecklist(
        isThisWeek ? ["Electrical cords and panels properly guarded"] : []
      ),
      violations: isThisWeek
        ? [
            {
              description: "Exposed wiring near panel B, temporary fix only.",
              severity: "medium",
              status: "open",
            },
          ]
        : [],
    });
    await inspection.save();
  }

  console.log("\nDone. Demo data summary:");
  console.log("  Sites: Riverside Commons, Midtown Tower, Peachtree Industrial, Lakeview Business Center");
  console.log("  Supervisor login 1: jordan.reyes@example.com / " + DEMO_PASSWORD);
  console.log("  Supervisor login 2: casey.nguyen@example.com / " + DEMO_PASSWORD);
  console.log("\nLog in as your admin account to see all four sites and the full dashboard,");
  console.log("or log in as a supervisor above to see the role-scoped view.");

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
