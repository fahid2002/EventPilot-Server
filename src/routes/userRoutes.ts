import { Router } from "express";
import { attendEvent, dashboard, reviewWebsite, saveEvent } from "../controllers/userController";
import { blockDemoMutations, requireAuth } from "../middleware/auth";

export const userRoutes = Router();

userRoutes.get("/dashboard", requireAuth, dashboard);
userRoutes.post("/saved/:eventId", requireAuth, blockDemoMutations, saveEvent);
userRoutes.post("/attend/:eventId", requireAuth, blockDemoMutations, attendEvent);
userRoutes.post("/reviews", requireAuth, blockDemoMutations, reviewWebsite);
