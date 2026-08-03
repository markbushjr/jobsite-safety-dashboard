import User from "../models/User.js";

// GET /api/users?role=supervisor  (admin only)
// Used by the Sites page to populate the "assign supervisors" picker.
export async function getUsers(req, res) {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select("name email role");
    res.json({ users });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ message: "Something went wrong fetching users." });
  }
}
