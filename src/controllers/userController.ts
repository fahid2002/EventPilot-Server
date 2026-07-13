import type { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { Event } from "../models/Event";
import { SavedEvent } from "../models/SavedEvent";
import { Attendance } from "../models/Attendance";
import { Review } from "../models/Review";
import { AppError } from "../middleware/error";

function objectId(id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError("Invalid ID.", 400);
  return new Types.ObjectId(id);
}

export async function dashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = objectId(req.user!.id);

    const [savedDocs, attendingDocs, reviewCount] = await Promise.all([
      SavedEvent.find({ userId }).populate("eventId"),
      Attendance.find({ userId, status: "confirmed" }).populate("eventId"),
      Review.countDocuments({ userId })
    ]);

    const saved = savedDocs.map((doc: any) => doc.eventId).filter(Boolean);
    const attending = attendingDocs.map((doc: any) => doc.eventId).filter(Boolean);
    const recommended = await Event.find({ status: "approved" }).sort({ rating: -1 }).limit(3);

    res.json({
      success: true,
      message: "Dashboard loaded.",
      data: {
        summary: {
          savedCount: saved.length,
          attendingCount: attending.length,
          reviewCount,
          recommendationCount: recommended.length
        },
        saved,
        attending,
        recommended
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function saveEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = objectId(req.user!.id);
    const eventId = objectId(req.params.eventId);
    const event = await Event.findById(eventId);
    if (!event || event.status !== "approved") throw new AppError("This event is not available.", 404);

    await SavedEvent.updateOne({ userId, eventId }, { userId, eventId }, { upsert: true });
    res.json({ success: true, message: "Event saved to dashboard.", data: { saved: true } });
  } catch (error) {
    next(error);
  }
}

export async function attendEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = objectId(req.user!.id);
    const eventId = objectId(req.params.eventId);
    const event = await Event.findById(eventId);
    if (!event || event.status !== "approved") throw new AppError("This event is not available.", 404);

    if (event.accessType === "premium" && req.user?.membership !== "premium") {
      return res.status(402).json({
        success: false,
        message: "Premium membership is required to attend this premium event.",
        data: { attending: false, redirectToPayment: true }
      });
    }

    await Attendance.updateOne({ userId, eventId }, { userId, eventId, status: "confirmed" }, { upsert: true });
    res.json({ success: true, message: "Attendance confirmed.", data: { attending: true } });
  } catch (error) {
    next(error);
  }
}

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10)
});

export async function reviewWebsite(req: Request, res: Response, next: NextFunction) {
  try {
    const body = reviewSchema.parse(req.body);
    const review = await Review.create({ userId: req.user!.id, rating: body.rating, comment: body.comment });
    res.status(201).json({ success: true, message: "Website review submitted.", data: { reviewId: review._id } });
  } catch (error) {
    next(error);
  }
}
