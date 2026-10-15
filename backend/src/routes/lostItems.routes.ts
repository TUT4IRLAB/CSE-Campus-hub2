import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import {
  listItems,
  myReports,
  reportItem,
  updateItemStatus,
  deleteItem,
} from "../controllers/lostItems.controller";

const router = Router();

router.get("/", requireAuth, asyncHandler(async (req, res) => listItems(req, res)));
router.get("/mine", requireAuth, asyncHandler(async (req, res) => myReports(req, res)));
router.post("/", requireAuth, asyncHandler(async (req, res) => reportItem(req, res)));
// Only security guards can update status (mark Found / Returned).
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("SECURITY_GUARD"),
  asyncHandler(async (req, res) => updateItemStatus(req, res)),
);

// Only security guards can delete records.
router.delete(
  "/:id",
  requireAuth,
  requireRole("SECURITY_GUARD"),
  asyncHandler(async (req, res) => deleteItem(req, res)),
);

export default router;
