import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { User, type Role } from "../models/User";
import { AppError } from "../middleware/error";
import { signToken } from "../utils/jwt";

const publicRoles = ["user", "organizer"] as const;

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  photoUrl: z.string().optional(),
  role: z.enum(publicRoles)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(["user", "organizer", "admin"])
});

const googleSchema = z.object({
  credential: z.string().min(1),
  role: z.enum(publicRoles)
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
    const exists = await User.findOne({ email, role: body.role });
    if (exists) throw new AppError(`This email is already registered as ${body.role}. Please login instead.`, 409);

    const password = await bcrypt.hash(body.password, 12);
    const user = await User.create({
      name: body.name,
      email,
      password,
      photoUrl: body.photoUrl || "",
      role: body.role,
      membership: body.role === "organizer" ? "premium" : "free"
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
    const user = await User.findOne({ email: body.email.toLowerCase(), role: body.role }).select("+password");
    if (!user || !user.password) throw new AppError(`No ${body.role} account found for this email, or the password is incorrect.`, 401);

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
    const body = googleSchema.parse(req.body);
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new AppError("Google client ID is not configured on server.", 500);

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken: body.credential, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload?.email) throw new AppError("Google did not return an email address.", 401);

    const user = await User.findOne({ email: payload.email.toLowerCase(), role: body.role });
    if (!user) {
      throw new AppError(`This email is not registered as ${body.role}. Please register first.`, 404);
    }
    if (user.role === "admin") throw new AppError("Admin cannot login with Google. Use email and password.", 403);
    if (!user.googleId) {
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

export async function googleRegister(req: Request, res: Response, next: NextFunction) {
  try {
    const body = googleSchema.parse(req.body);
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new AppError("Google client ID is not configured on server.", 500);

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken: body.credential, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload?.email) throw new AppError("Google did not return an email address.", 401);

    const email = payload.email.toLowerCase();
    const exists = await User.findOne({ email, role: body.role });
    if (exists) throw new AppError(`This email is already registered as ${body.role}. Please login instead.`, 409);

    const user = await User.create({
      name: payload.name || "EventPilot User",
      email,
      googleId: payload.sub,
      photoUrl: payload.picture || "",
      role: body.role as Role,
      membership: body.role === "organizer" ? "premium" : "free"
    });

    const token = signToken(user);
    res.status(201).json({ success: true, message: "Google account registered successfully.", data: { user: publicUser(user), token } });
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
