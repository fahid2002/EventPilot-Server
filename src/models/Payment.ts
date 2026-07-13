import mongoose, { Document, Schema, Types } from "mongoose";

export interface IPayment extends Document {
  userId: Types.ObjectId;
  eventId?: Types.ObjectId;
  amount: number;
  provider: "demo" | "stripe";
  status: "pending" | "paid" | "failed";
  stripeSessionId?: string;
}

const paymentSchema = new Schema<IPayment>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  eventId: { type: Schema.Types.ObjectId, ref: "Event" },
  amount: { type: Number, required: true },
  provider: { type: String, enum: ["demo", "stripe"], required: true },
  status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  stripeSessionId: { type: String }
}, { timestamps: true });

export const Payment = mongoose.model<IPayment>("Payment", paymentSchema);
