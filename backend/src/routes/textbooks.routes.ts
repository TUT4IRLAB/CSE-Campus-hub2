import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import {
  listBooks,
  getBook,
  myListings,
  createListing,
  deleteListing,
} from "../controllers/textbooks.controller";

const router = Router();

router.get("/", requireAuth, asyncHandler(async (req, res) => listBooks(req, res)));
router.get("/mine", requireAuth, asyncHandler(async (req, res) => myListings(req, res)));
router.get("/:id", requireAuth, asyncHandler(async (req, res) => getBook(req, res)));
router.post("/", requireAuth, asyncHandler(async (req, res) => createListing(req, res)));
router.delete("/:id", requireAuth, asyncHandler(async (req, res) => deleteListing(req, res)));

export default router;
