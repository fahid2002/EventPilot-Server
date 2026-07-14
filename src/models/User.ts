import mongoose, { Document, Schema, Types } from "mongoose";

export type Role = "user" | "organizer" | "admin";
export type Membership = "free" | "premium";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  photoUrl?: string;
  role: Role;
  membership: Membership;
  isDemo: boolean;
  status: "active" | "blocked";
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  password: { type: String, select: false },
  googleId: { type: String },
  photoUrl: { type: String, default: "" },
  role: { type: String, enum: ["user", "organizer", "admin"], default: "user" },
  membership: { type: String, enum: ["free", "premium"], default: "free" },
  isDemo: { type: Boolean, default: false },
  status: { type: String, enum: ["active", "blocked"], default: "active" }
}, { timestamps: true });

userSchema.index({ email: 1, role: 1 }, { unique: true });

export const User = mongoose.model<IUser>("User", userSchema);
