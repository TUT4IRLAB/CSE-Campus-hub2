import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import {
  listGroups,
  getGroup,
  createGroup,
  joinGroup,
  leaveGroup,
  myGroups,
  deleteGroup,
} from "../controllers/studyGroups.controller";

const router = Router();

// Public browse (optionalAuth-style: requireAuth still needed to know "joined" state
// for a personalised view; if you want fully public browsing, remove requireAuth here).
router.get("/", requireAuth, asyncHandler(async (req, res) => listGroups(req, res)));
router.get("/mine", requireAuth, asyncHandler(async (req, res) => myGroups(req, res)));
router.get("/:id", requireAuth, asyncHandler(async (req, res) => getGroup(req, res)));
router.post("/", requireAuth, asyncHandler(async (req, res) => createGroup(req, res)));
router.post("/:id/join", requireAuth, asyncHandler(async (req, res) => joinGroup(req, res)));
router.post("/:id/leave", requireAuth, asyncHandler(async (req, res) => leaveGroup(req, res)));

router.delete("/:id", requireAuth, asyncHandler(async (req, res) => deleteGroup(req, res)));

export default router;
