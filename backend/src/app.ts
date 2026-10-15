import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import studyGroupsRoutes from "./routes/studyGroups.routes";
import lostItemsRoutes from "./routes/lostItems.routes";
import textbooksRoutes from "./routes/textbooks.routes";
import eventsRoutes from "./routes/events.routes";
import adminRoutes from "./routes/admin.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/study-groups", studyGroupsRoutes);
app.use("/api/lost-items", lostItemsRoutes);
app.use("/api/textbooks", textbooksRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/admin", adminRoutes);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use(errorHandler);

export default app;
