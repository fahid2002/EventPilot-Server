import mongoose, { Document, Schema, Types } from "mongoose";

export interface ISavedEvent extends Document {
  userId: Types.ObjectId;
  eventId: Types.ObjectId;
}

const savedEventSchema = new Schema<ISavedEvent>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true }
}, { timestamps: true });

savedEventSchema.index({ userId: 1, eventId: 1 }, { unique: true });
export const SavedEvent = mongoose.model<ISavedEvent>("SavedEvent", savedEventSchema);
