import type { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { Types } from "mongoose";
import { Event } from "../models/Event";
import { User } from "../models/User";
import { Payment } from "../models/Payment";
import { Attendance } from "../models/Attendance";
import { AppError } from "../middleware/error";

function objectId(id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError("Invalid ID.", 400);
  return new Types.ObjectId(id);
}

export async function createCheckout(req: Request, res: Response, next: NextFunction) {
  try {
    const secret = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;
    if (!secret || !priceId) {
      throw new AppError("Stripe is not configured yet. Add STRIPE_SECRET_KEY and STRIPE_PREMIUM_PRICE_ID, or use demo upgrade for local testing.", 500);
    }

    const eventId = objectId(req.params.eventId);
    const event = await Event.findById(eventId);
    if (!event) throw new AppError("Event not found.", 404);

    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: undefined,
      metadata: {
        userId: req.user!.id,
        eventId: eventId.toString(),
        purpose: "premium_membership"
      },
      success_url: process.env.STRIPE_SUCCESS_URL || `${process.env.CLIENT_URL}/dashboard?payment=success`,
      cancel_url: process.env.STRIPE_CANCEL_URL || `${process.env.CLIENT_URL}/payment/${eventId.toString()}`
    });

    await Payment.create({ userId: req.user!.id, eventId, amount: 999, provider: "stripe", status: "pending", stripeSessionId: session.id });
    res.json({ success: true, message: "Stripe Checkout session created.", data: { url: session.url } });
  } catch (error) {
    next(error);
  }
}

export async function demoUpgrade(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = objectId(req.user!.id);
    const eventId = objectId(req.params.eventId);
    const event = await Event.findById(eventId);
    if (!event) throw new AppError("Event not found.", 404);

    const user = await User.findByIdAndUpdate(userId, { membership: "premium" }, { new: true });
    if (!user) throw new AppError("User not found.", 404);

    await Payment.create({ userId, eventId, amount: 999, provider: "demo", status: "paid" });
    await Attendance.updateOne({ userId, eventId }, { userId, eventId, status: "confirmed" }, { upsert: true });

    res.json({
      success: true,
      message: "Demo premium upgrade completed and attendance confirmed.",
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          membership: user.membership,
          photoUrl: user.photoUrl,
          isDemo: user.isDemo,
          status: user.status
        },
        attending: true
      }
    });
  } catch (error) {
    next(error);
  }
}
