import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { overview, deletePost } from "../controllers/admin.controller";

const router = Router();

// Everything under /api/admin is admin-only.
router.use(requireAuth, requireRole("ADMIN"));

router.get("/overview", asyncHandler(async (req, res) => overview(req, res)));
router.delete("/:type/:id", asyncHandler(async (req, res) => deletePost(req, res)));

export default router;
