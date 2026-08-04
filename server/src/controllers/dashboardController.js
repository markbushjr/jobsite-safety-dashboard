import Site from "../models/Site.js";
import Inspection from "../models/Inspection.js";

// Groups a date into the Monday of its week, used to bucket inspections
// into weekly trend points regardless of which day they were submitted.
function weekKeyFor(date) {
  const d = new Date(date);
  const day = d.getUTCDay() || 7; // Sunday (0) -> 7, so Monday is always day 1
  d.setUTCDate(d.getUTCDate() - day + 1);
  return d.toISOString().slice(0, 10);
}

// GET /api/dashboard/summary
// Returns everything the dashboard needs in one call: overall compliance
// rate, open violation count, which sites are overdue for inspection,
// and an 8-week compliance rate trend -- all scoped to the sites the
// requesting user is allowed to see (all sites for admins, assigned
// sites only for supervisors).
export async function getDashboardSummary(req, res) {
  try {
    const siteFilter = req.user.role === "admin" ? {} : { supervisors: req.user.id };
    const sites = await Site.find(siteFilter);
    const siteIds = sites.map((s) => s._id);

    const now = new Date();

    // Determine each site's current standing from its most recent inspection.
    const perSite = await Promise.all(
      sites.map(async (site) => {
        const latest = await Inspection.findOne({ site: site._id }).sort({ weekOf: -1 });
        const frequencyMs = (site.inspectionFrequencyDays || 7) * 24 * 60 * 60 * 1000;
        const overdue = !latest || now - new Date(latest.weekOf) > frequencyMs;
        return { site, latest, overdue };
      })
    );

    const overdueSites = perSite
      .filter((s) => s.overdue)
      .map((s) => ({
        id: s.site._id,
        name: s.site.name,
        lastInspection: s.latest ? s.latest.weekOf : null,
      }));

    const compliantSites = perSite.filter(
      (s) => !s.overdue && s.latest?.overallStatus === "compliant"
    ).length;

    const totalSites = sites.length;
    const complianceRate = totalSites === 0 ? 0 : Math.round((compliantSites / totalSites) * 100);

    // Count open violations across all inspections for accessible sites.
    const openViolationsResult = await Inspection.aggregate([
      { $match: { site: { $in: siteIds } } },
      { $unwind: "$violations" },
      { $match: { "violations.status": "open" } },
      { $count: "count" },
    ]);
    const openViolations = openViolationsResult[0]?.count || 0;

    // Build an 8-week compliance rate trend so the dashboard can chart
    // whether things are getting better or worse over time.
    const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);
    const recentInspections = await Inspection.find({
      site: { $in: siteIds },
      weekOf: { $gte: eightWeeksAgo },
    }).select("weekOf overallStatus");

    const buckets = {};
    recentInspections.forEach((insp) => {
      const key = weekKeyFor(insp.weekOf);
      if (!buckets[key]) buckets[key] = { total: 0, compliant: 0 };
      buckets[key].total += 1;
      if (insp.overallStatus === "compliant") buckets[key].compliant += 1;
    });

    const trend = Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, data]) => ({
        week,
        complianceRate: Math.round((data.compliant / data.total) * 100),
      }));

    res.json({
      totalSites,
      compliantSites,
      complianceRate,
      openViolations,
      overdueSites,
      trend,
    });
  } catch (err) {
    console.error("Dashboard summary error:", err);
    res.status(500).json({ message: "Something went wrong loading the dashboard." });
  }
}
