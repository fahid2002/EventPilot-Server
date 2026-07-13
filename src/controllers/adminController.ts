import type { Request, Response, NextFunction } from "express";
import { Event } from "../models/Event";
import { User } from "../models/User";
import { AppError } from "../middleware/error";

export async function pendingEvents(_req: Request, res: Response, next: NextFunction) {
  try {
    const events = await Event.find({ status: "pending" }).sort({ createdAt: -1 });
    res.json({ success: true, message: "Pending events loaded.", data: { events } });
  } catch (error) {
    next(error);
  }
}

export async function updateEventStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) throw new AppError("Status must be approved or rejected.", 400);
    const event = await Event.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!event) throw new AppError("Event not found.", 404);
    res.json({ success: true, message: `Event ${status}.`, data: { event } });
  } catch (error) {
    next(error);
  }
}

export async function listUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, message: "Users loaded.", data: { users } });
  } catch (error) {
    next(error);
  }
}

export async function updateUserRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = req.body;
    if (!["user", "organizer", "admin"].includes(role)) throw new AppError("Invalid role.", 400);
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) throw new AppError("User not found.", 404);
    res.json({ success: true, message: "User role updated.", data: { user } });
  } catch (error) {
    next(error);
  }
}
