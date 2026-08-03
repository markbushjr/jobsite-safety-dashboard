import express from "express";
import {
  createSite,
  getSites,
  getSiteById,
  updateSite,
  deleteSite,
} from "../controllers/siteController.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

// All site routes require a logged-in user.
router.use(protect);

router.get("/", getSites);
router.get("/:id", getSiteById);

// Only admins can create, edit, or remove sites.
router.post("/", requireRole("admin"), createSite);
router.patch("/:id", requireRole("admin"), updateSite);
router.delete("/:id", requireRole("admin"), deleteSite);

export default router;
