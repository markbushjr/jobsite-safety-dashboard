import express from "express";
import {
  createInspection,
  getInspections,
  getInspectionById,
  resolveViolation,
} from "../controllers/inspectionController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All inspection routes require a logged-in user. Fine-grained access
// (which sites a user can touch) is handled inside the controller.
router.use(protect);

router.post("/", createInspection);
router.get("/", getInspections);
router.get("/:id", getInspectionById);
router.patch("/:id/violations/:violationId/resolve", resolveViolation);

export default router;
