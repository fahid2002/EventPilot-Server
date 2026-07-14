import jwt from "jsonwebtoken";
import type { IUser } from "../models/User";

export function signToken(user: IUser) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing");
  const expiresIn = (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"];

  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      membership: user.membership,
      isDemo: user.isDemo
    },
    secret,
    { expiresIn }
  );
}
