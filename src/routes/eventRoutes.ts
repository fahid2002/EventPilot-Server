import { Router } from "express";
import { createEvent, deleteEvent, getEvent, listEvents, manageEvents } from "../controllers/eventController";
import { blockDemoMutations, requireAuth, requireRole } from "../middleware/auth";

export const eventRoutes = Router();

eventRoutes.get("/", listEvents);
eventRoutes.get("/manage/list", requireAuth, requireRole("organizer", "admin"), manageEvents);
eventRoutes.get("/:id", getEvent);
eventRoutes.post("/", requireAuth, blockDemoMutations, requireRole("organizer", "admin"), createEvent);
eventRoutes.delete("/:id", requireAuth, blockDemoMutations, requireRole("organizer", "admin"), deleteEvent);
