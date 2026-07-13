import { Router } from "express";
import { createCheckout, demoUpgrade } from "../controllers/paymentController";
import { blockDemoMutations, requireAuth } from "../middleware/auth";

export const paymentRoutes = Router();

paymentRoutes.post("/checkout/:eventId", requireAuth, blockDemoMutations, createCheckout);
paymentRoutes.post("/demo-upgrade/:eventId", requireAuth, blockDemoMutations, demoUpgrade);
