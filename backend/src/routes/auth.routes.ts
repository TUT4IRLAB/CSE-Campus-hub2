import { Router } from "express";
import { register, login, forgotPassword, me } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

router.post("/register", asyncHandler(async (req, res) => register(req, res)));
router.post("/login", asyncHandler(async (req, res) => login(req, res)));
router.post("/forgot-password", asyncHandler(async (req, res) => forgotPassword(req, res)));
router.get("/me", requireAuth, asyncHandler(async (req, res) => me(req, res)));

export default router;
