import { Router } from "express";
import { listUsers, pendingEvents, updateEventStatus, updateUserRole } from "../controllers/adminController";
import { blockDemoMutations, requireAuth, requireRole } from "../middleware/auth";

export const adminRoutes = Router();

adminRoutes.use(requireAuth, blockDemoMutations, requireRole("admin"));
adminRoutes.get("/events/pending", pendingEvents);
adminRoutes.patch("/events/:id/status", updateEventStatus);
adminRoutes.get("/users", listUsers);
adminRoutes.patch("/users/:id/role", updateUserRole);
