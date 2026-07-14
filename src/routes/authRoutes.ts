import { Router } from "express";
import { googleLogin, googleRegister, login, me, register } from "../controllers/authController";
import { requireAuth } from "../middleware/auth";

export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/google", googleLogin);
authRoutes.post("/google/register", googleRegister);
authRoutes.get("/me", requireAuth, me);
