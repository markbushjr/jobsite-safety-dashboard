import Inspection from "../models/Inspection.js";
import Site from "../models/Site.js";

// Helper: confirms a user is allowed to act on a given site.
// Admins can act on any site; supervisors only on sites they're assigned to.
async function userCanAccessSite(user, siteId) {
  if (user.role === "admin") return true;
  const site = await Site.findById(siteId);
  if (!site) return false;
  return site.supervisors.some((s) => s.toString() === user.id);
}

// POST /api/inspections
export async function createInspection(req, res) {
  try {
    const { site, weekOf, checklist, violations } = req.body;

    if (!site || !weekOf) {
      return res.status(400).json({ message: "Site and weekOf are required." });
    }

    const allowed = await userCanAccessSite(req.user, site);
    if (!allowed) {
      return res.status(403).json({ message: "You are not assigned to this site." });
    }

    const inspection = await Inspection.create({
      site,
      submittedBy: req.user.id,
      weekOf,
      checklist: checklist || [],
      violations: violations || [],
    });

    res.status(201).json({ inspection });
  } catch (err) {
    console.error("Create inspection error:", err);
    res.status(500).json({ message: "Something went wrong submitting the inspection." });
  }
}

// GET /api/inspections
// Supports optional query filters: ?site=<id>&status=compliant|non-compliant
// Admins see inspections across all sites; supervisors only their assigned sites.
export async function getInspections(req, res) {
  try {
    const { site, status } = req.query;
    const filter = {};

    if (status) filter.overallStatus = status;

    if (req.user.role === "admin") {
      if (site) filter.site = site;
    } else {
      // Restrict to sites this supervisor is assigned to.
      const sites = await Site.find({ supervisors: req.user.id }).select("_id");
      const siteIds = sites.map((s) => s._id);
      filter.site = site ? site : { $in: siteIds };
    }

    const inspections = await Inspection.find(filter)
      .populate("site", "name")
      .populate("submittedBy", "name")
      .sort({ weekOf: -1 });

    res.json({ inspections });
  } catch (err) {
    console.error("Get inspections error:", err);
    res.status(500).json({ message: "Something went wrong fetching inspections." });
  }
}

// GET /api/inspections/:id
export async function getInspectionById(req, res) {
  try {
    const inspection = await Inspection.findById(req.params.id)
      .populate("site", "name")
      .populate("submittedBy", "name");

    if (!inspection) {
      return res.status(404).json({ message: "Inspection not found." });
    }

    const allowed = await userCanAccessSite(req.user, inspection.site._id);
    if (!allowed) {
      return res.status(403).json({ message: "You do not have access to this inspection." });
    }

    res.json({ inspection });
  } catch (err) {
    console.error("Get inspection error:", err);
    res.status(500).json({ message: "Something went wrong fetching the inspection." });
  }
}

// PATCH /api/inspections/:id/violations/:violationId/resolve
// Marks a specific violation within an inspection as resolved, and
// re-triggers the pre-save hook so overallStatus recalculates.
export async function resolveViolation(req, res) {
  try {
    const { id, violationId } = req.params;

    const inspection = await Inspection.findById(id);
    if (!inspection) {
      return res.status(404).json({ message: "Inspection not found." });
    }

    const allowed = await userCanAccessSite(req.user, inspection.site);
    if (!allowed) {
      return res.status(403).json({ message: "You do not have access to this inspection." });
    }

    const violation = inspection.violations.id(violationId);
    if (!violation) {
      return res.status(404).json({ message: "Violation not found." });
    }

    violation.status = "resolved";
    violation.resolvedAt = new Date();

    await inspection.save(); // pre("save") hook recalculates overallStatus

    res.json({ inspection });
  } catch (err) {
    console.error("Resolve violation error:", err);
    res.status(500).json({ message: "Something went wrong resolving the violation." });
  }
}
