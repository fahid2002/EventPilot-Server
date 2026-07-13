import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { User } from "../models/User";
import { AppError } from "../middleware/error";
import { signToken } from "../utils/jwt";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  photoUrl: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

function publicUser(user: any) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    membership: user.membership,
    photoUrl: user.photoUrl,
    isDemo: user.isDemo,
    status: user.status
  };
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const body = registerSchema.parse(req.body);
    const email = body.email.toLowerCase();
    const exists = await User.findOne({ email });
    if (exists) throw new AppError("This email is already registered. Please login instead.", 409);

    const password = await bcrypt.hash(body.password, 12);
    const user = await User.create({
      name: body.name,
      email,
      password,
      photoUrl: body.photoUrl || "",
      role: "user",
      membership: "free"
    });

    const token = signToken(user);
    res.status(201).json({ success: true, message: "Account created successfully.", data: { user: publicUser(user), token } });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const body = loginSchema.parse(req.body);
    const user = await User.findOne({ email: body.email.toLowerCase() }).select("+password");
    if (!user || !user.password) throw new AppError("Invalid email or password.", 401);

    const matched = await bcrypt.compare(body.password, user.password);
    if (!matched) throw new AppError("Invalid email or password.", 401);
    if (user.status === "blocked") throw new AppError("This account has been blocked by admin.", 403);

    const token = signToken(user);
    res.json({ success: true, message: "Login successful.", data: { user: publicUser(user), token } });
  } catch (error) {
    next(error);
  }
}

export async function googleLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const credential = String(req.body.credential || "");
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new AppError("Google client ID is not configured on server.", 500);

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload?.email) throw new AppError("Google did not return an email address.", 401);

    let user = await User.findOne({ email: payload.email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name: payload.name || "EventPilot User",
        email: payload.email.toLowerCase(),
        googleId: payload.sub,
        photoUrl: payload.picture || "",
        role: "user",
        membership: "free"
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      if (!user.photoUrl && payload.picture) user.photoUrl = payload.picture;
      await user.save();
    }

    const token = signToken(user);
    res.json({ success: true, message: "Google login successful.", data: { user: publicUser(user), token } });
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) throw new AppError("User not found.", 404);
    res.json({ success: true, message: "Profile loaded.", data: { user: publicUser(user) } });
  } catch (error) {
    next(error);
  }
}
