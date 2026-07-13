import mongoose, { Document, Schema, Types } from "mongoose";

export type EventStatus = "pending" | "approved" | "rejected";
export type EventAccess = "free" | "premium";

export interface IEvent extends Document {
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  location: string;
  date: Date;
  price: number;
  accessType: EventAccess;
  status: EventStatus;
  imageUrl: string;
  gallery: string[];
  rating: number;
  capacity: number;
  organizerId: Types.ObjectId;
  organizerName: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>({
  title: { type: String, required: true, trim: true },
  shortDescription: { type: String, required: true, trim: true },
  fullDescription: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  price: { type: Number, required: true, min: 0 },
  accessType: { type: String, enum: ["free", "premium"], default: "free" },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  imageUrl: { type: String, required: true },
  gallery: [{ type: String }],
  rating: { type: Number, default: 4.5, min: 0, max: 5 },
  capacity: { type: Number, default: 50 },
  organizerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  organizerName: { type: String, required: true },
  tags: [{ type: String }]
}, { timestamps: true });

eventSchema.index({ title: "text", category: "text", location: "text" });

export const Event = mongoose.model<IEvent>("Event", eventSchema);
