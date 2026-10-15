import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import {
  listEvents,
  getEvent,
  registerForEvent,
  unregisterFromEvent,
  myEvents,
  createEvent,
  deleteEvent,
} from "../controllers/events.controller";

const router = Router();

router.get("/", requireAuth, asyncHandler(async (req, res) => listEvents(req, res)));
router.get("/mine", requireAuth, asyncHandler(async (req, res) => myEvents(req, res)));
router.post("/", requireAuth, asyncHandler(async (req, res) => createEvent(req, res)));
router.get("/:id", requireAuth, asyncHandler(async (req, res) => getEvent(req, res)));
router.post("/:id/register", requireAuth, asyncHandler(async (req, res) => registerForEvent(req, res)));
router.delete("/:id/register", requireAuth, asyncHandler(async (req, res) => unregisterFromEvent(req, res)));

router.delete("/:id", requireAuth, asyncHandler(async (req, res) => deleteEvent(req, res)));

export default router;
