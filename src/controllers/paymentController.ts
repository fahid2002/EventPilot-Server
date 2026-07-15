import type {
  Request,
  Response,
  NextFunction,
} from "express";
import Stripe from "stripe";
import { Types } from "mongoose";
import { Event } from "../models/Event";
import { User } from "../models/User";
import { Payment } from "../models/Payment";
import { Attendance } from "../models/Attendance";
import { AppError } from "../middleware/error";

// Validates and converts a string into a MongoDB ObjectId
function objectId(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid ID.", 400);
  }

  return new Types.ObjectId(id);
}

async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") {
    throw new AppError("Stripe payment is not completed yet.", 400);
  }

  const userId = session.metadata?.userId;
  const eventId = session.metadata?.eventId;

  if (
    !userId ||
    !eventId ||
    !Types.ObjectId.isValid(userId) ||
    !Types.ObjectId.isValid(eventId)
  ) {
    throw new AppError("Stripe session metadata is invalid.", 400);
  }

  const userObjectId = new Types.ObjectId(userId);
  const eventObjectId = new Types.ObjectId(eventId);

  const [user] = await Promise.all([
    User.findByIdAndUpdate(
      userObjectId,
      {
        membership: "premium",
      },
      {
        new: true,
      }
    ),

    Payment.findOneAndUpdate(
      {
        stripeSessionId: session.id,
      },
      {
        userId: userObjectId,
        eventId: eventObjectId,
        amount: 999,
        provider: "stripe",
        status: "paid",
        stripeSessionId: session.id,
      },
      {
        new: true,
        upsert: true,
      }
    ),

    Attendance.updateOne(
      {
        userId: userObjectId,
        eventId: eventObjectId,
      },
      {
        userId: userObjectId,
        eventId: eventObjectId,
        status: "confirmed",
      },
      {
        upsert: true,
      }
    ),
  ]);

  if (!user) {
    throw new AppError("User not found for completed payment.", 404);
  }

  return user;
}

// Creates a Stripe Checkout session for premium membership
export async function createCheckout(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const secret = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;

    if (!secret || !priceId) {
      throw new AppError(
        "Stripe is not configured yet. Add STRIPE_SECRET_KEY and STRIPE_PREMIUM_PRICE_ID, or use demo upgrade for local testing.",
        500
      );
    }

    const eventId = objectId(req.params.eventId);

    const event = await Event.findById(eventId);

    if (!event) {
      throw new AppError("Event not found.", 404);
    }

    const stripe = new Stripe(secret);
    const configuredSuccessUrl =
      process.env.STRIPE_SUCCESS_URL ||
      `${process.env.CLIENT_URL}/dashboard?payment=success`;
    const successUrl = configuredSuccessUrl.includes("{CHECKOUT_SESSION_ID}")
      ? configuredSuccessUrl
      : `${configuredSuccessUrl}${configuredSuccessUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      customer_email: undefined,

      metadata: {
        userId: req.user!.id,
        eventId: eventId.toString(),
        purpose: "premium_membership",
      },

      success_url: successUrl,

      cancel_url:
        process.env.STRIPE_CANCEL_URL ||
        `${process.env.CLIENT_URL}/payment/${eventId.toString()}`,
    });

    // Save pending Stripe payment record
    await Payment.create({
      userId: req.user!.id,
      eventId,
      amount: 999,
      provider: "stripe",
      status: "pending",
      stripeSessionId: session.id,
    });

    res.json({
      success: true,
      message: "Stripe Checkout session created.",
      data: {
        url: session.url,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function confirmCheckout(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const secret = process.env.STRIPE_SECRET_KEY;

    if (!secret) {
      throw new AppError("Stripe is not configured.", 500);
    }

    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.retrieve(
      req.params.sessionId
    );

    if (session.metadata?.userId !== req.user!.id) {
      throw new AppError("This payment session does not belong to the logged-in user.", 403);
    }

    const user = await fulfillCheckoutSession(session);

    res.json({
      success: true,
      message: "Premium membership activated.",
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          membership: user.membership,
          photoUrl: user.photoUrl,
          isDemo: user.isDemo,
          status: user.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

// Completes a demo premium upgrade for local testing
export async function demoUpgrade(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = objectId(req.user!.id);
    const eventId = objectId(req.params.eventId);

    const event = await Event.findById(eventId);

    if (!event) {
      throw new AppError("Event not found.", 404);
    }

    // Upgrade user membership to premium
    const user = await User.findByIdAndUpdate(
      userId,
      {
        membership: "premium",
      },
      {
        new: true,
      }
    );

    if (!user) {
      throw new AppError("User not found.", 404);
    }

    // Save demo payment record
    await Payment.create({
      userId,
      eventId,
      amount: 999,
      provider: "demo",
      status: "paid",
    });

    // Confirm user attendance for the event
    await Attendance.updateOne(
      {
        userId,
        eventId,
      },
      {
        userId,
        eventId,
        status: "confirmed",
      },
      {
        upsert: true,
      }
    );

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
          status: user.status,
        },
        attending: true,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Handles Stripe webhook payment events
export async function handleStripeWebhook(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const secret = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const signature = req.headers["stripe-signature"];

    if (!secret || !webhookSecret) {
      throw new AppError(
        "Stripe webhook is not configured.",
        500
      );
    }

    if (!signature || Array.isArray(signature)) {
      throw new AppError(
        "Stripe signature is missing.",
        400
      );
    }

    if (!Buffer.isBuffer(req.body)) {
      throw new AppError(
        "Stripe webhook body must be raw.",
        400
      );
    }

    const stripe = new Stripe(secret);

    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret
    );

    // Complete premium upgrade after successful Stripe payment
    if (event.type === "checkout.session.completed") {
      const session =
        event.data.object as Stripe.Checkout.Session;

      await fulfillCheckoutSession(session);
    }

    res.json({
      received: true,
    });
  } catch (error) {
    next(error);
  }
}
