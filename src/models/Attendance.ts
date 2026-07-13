import mongoose, { Document, Schema, Types } from "mongoose";

export interface IAttendance extends Document {
  userId: Types.ObjectId;
  eventId: Types.ObjectId;
  status: "confirmed" | "cancelled";
}

const attendanceSchema = new Schema<IAttendance>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
  status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" }
}, { timestamps: true });

attendanceSchema.index({ userId: 1, eventId: 1 }, { unique: true });
export const Attendance = mongoose.model<IAttendance>("Attendance", attendanceSchema);
