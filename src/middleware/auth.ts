import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./error";
import { User, type Role } from "../models/User";

interface JwtPayload {
  id: string;
  role: Role;
  membership: "free" | "premium";
  isDemo: boolean;
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.split(" ")[1] : null;

    if (!token) throw new AppError("Authentication required. Please login first.", 401);
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new AppError("JWT_SECRET is missing on server.", 500);

    const decoded = jwt.verify(token, secret) as JwtPayload;
    const user = await User.findById(decoded.id);
    if (!user || user.status === "blocked") throw new AppError("Account not found or blocked.", 401);

    req.user = {
      id: user._id.toString(),
      role: user.role,
      membership: user.membership,
      isDemo: user.isDemo
    };
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError("Invalid or expired token.", 401));
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError("Authentication required.", 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You are not allowed to access this resource.", 403));
    }
    next();
  };
}

export function blockDemoMutations(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.isDemo) {
    return next(new AppError("Demo users can browse the website but cannot save, attend, review, pay, or modify data.", 403));
  }
  next();
}
