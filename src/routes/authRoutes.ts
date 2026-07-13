import { Router } from "express";
import { googleLogin, login, me, register } from "../controllers/authController";
import { requireAuth } from "../middleware/auth";

export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/google", googleLogin);
authRoutes.get("/me", requireAuth, me);
