import express from "express";
import { getUsers } from "../controllers/userController.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, requireRole("admin"));
router.get("/", getUsers);

export default router;
