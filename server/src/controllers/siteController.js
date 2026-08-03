import Site from "../models/Site.js";
import User from "../models/User.js";

// POST /api/sites  (admin only)
export async function createSite(req, res) {
  try {
    const { name, address, supervisors, inspectionFrequencyDays } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Site name is required." });
    }

    const site = await Site.create({
      name,
      address,
      supervisors: supervisors || [],
      inspectionFrequencyDays: inspectionFrequencyDays || 7,
    });

    res.status(201).json({ site });
  } catch (err) {
    console.error("Create site error:", err);
    res.status(500).json({ message: "Something went wrong creating the site." });
  }
}

// GET /api/sites
// Admins see every site. Supervisors only see sites they're assigned to.
export async function getSites(req, res) {
  try {
    let sites;
    if (req.user.role === "admin") {
      sites = await Site.find().populate("supervisors", "name email");
    } else {
      sites = await Site.find({ supervisors: req.user.id }).populate(
        "supervisors",
        "name email"
      );
    }
    res.json({ sites });
  } catch (err) {
    console.error("Get sites error:", err);
    res.status(500).json({ message: "Something went wrong fetching sites." });
  }
}

// GET /api/sites/:id
export async function getSiteById(req, res) {
  try {
    const site = await Site.findById(req.params.id).populate(
      "supervisors",
      "name email"
    );
    if (!site) {
      return res.status(404).json({ message: "Site not found." });
    }

    // Supervisors can only view sites they're assigned to.
    const isAssigned = site.supervisors.some(
      (s) => s._id.toString() === req.user.id
    );
    if (req.user.role !== "admin" && !isAssigned) {
      return res.status(403).json({ message: "You do not have access to this site." });
    }

    res.json({ site });
  } catch (err) {
    console.error("Get site error:", err);
    res.status(500).json({ message: "Something went wrong fetching the site." });
  }
}

// PATCH /api/sites/:id  (admin only)
export async function updateSite(req, res) {
  try {
    const { name, address, supervisors, status, inspectionFrequencyDays } = req.body;

    const site = await Site.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ message: "Site not found." });
    }

    if (name !== undefined) site.name = name;
    if (address !== undefined) site.address = address;
    if (supervisors !== undefined) site.supervisors = supervisors;
    if (status !== undefined) site.status = status;
    if (inspectionFrequencyDays !== undefined) {
      site.inspectionFrequencyDays = inspectionFrequencyDays;
    }

    await site.save();

    // Keep assignedSites on User docs in sync so supervisor-side queries
    // (e.g. "sites I'm responsible for") stay accurate.
    if (supervisors !== undefined) {
      await User.updateMany(
        { assignedSites: site._id },
        { $pull: { assignedSites: site._id } }
      );
      await User.updateMany(
        { _id: { $in: supervisors } },
        { $addToSet: { assignedSites: site._id } }
      );
    }

    res.json({ site });
  } catch (err) {
    console.error("Update site error:", err);
    res.status(500).json({ message: "Something went wrong updating the site." });
  }
}

// DELETE /api/sites/:id  (admin only)
export async function deleteSite(req, res) {
  try {
    const site = await Site.findByIdAndDelete(req.params.id);
    if (!site) {
      return res.status(404).json({ message: "Site not found." });
    }
    res.json({ message: "Site deleted." });
  } catch (err) {
    console.error("Delete site error:", err);
    res.status(500).json({ message: "Something went wrong deleting the site." });
  }
}
