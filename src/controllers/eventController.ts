import type {
  Request,
  Response,
  NextFunction,
} from "express";
import { z } from "zod";
import { Event } from "../models/Event";
import { User } from "../models/User";
import { AppError } from "../middleware/error";

// Default image used when an event image is not provided
const defaultEventImage =
  "https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=1200&auto=format&fit=crop";

// Validation rules for creating an event
const eventSchema = z.object({
  title: z
    .string()
    .min(3),

  shortDescription: z
    .string()
    .min(10),

  fullDescription: z
    .string()
    .min(20),

  category: z
    .string()
    .min(2),

  location: z
    .string()
    .min(2),

  date: z
    .string()
    .min(4),

  price: z
    .number()
    .min(0),

  accessType: z.enum([
    "free",
    "premium",
  ]),

  imageUrl: z
    .string()
    .url()
    .optional(),

  gallery: z
    .array(z.string())
    .optional(),

  capacity: z
    .number()
    .min(1)
    .optional(),

  tags: z
    .array(z.string())
    .optional(),
});

// Loads approved events with filtering, sorting, and pagination
export async function listEvents(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const page = Math.max(
      1,
      Number(req.query.page || 1)
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        Number(req.query.limit || 8)
      )
    );

    const skip = (page - 1) * limit;

    // Build event filter from query parameters
    const filter: any = {};

    if (req.query.status) {
      filter.status = req.query.status;
    } else {
      filter.status = "approved";
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.location) {
      filter.location = req.query.location;
    }

    if (req.query.accessType) {
      filter.accessType = req.query.accessType;
    }

    if (req.query.search) {
      filter.$text = {
        $search: String(req.query.search),
      };
    }

    // Select event sorting option
    const sortOption = String(
      req.query.sort || "date"
    );

    const sort: any =
      sortOption === "price"
        ? {
            price: 1,
          }
        : sortOption === "rating"
          ? {
              rating: -1,
            }
          : {
              date: 1,
            };

    const [
      events,
      total,
    ] = await Promise.all([
      Event
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit),

      Event.countDocuments(filter),
    ]);

    res.json({
      success: true,
      message: "Events loaded.",
      data: {
        events,
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Loads a single event by its ID
export async function getEvent(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const event = await Event.findById(
      req.params.id
    );

    if (!event) {
      throw new AppError(
        "Event not found.",
        404
      );
    }

    res.json({
      success: true,
      message: "Event loaded.",
      data: {
        event,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Loads all events for admins or organizer-owned events
export async function manageEvents(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const filter =
      req.user?.role === "admin"
        ? {}
        : {
            organizerId: req.user?.id,
          };

    const events = await Event
      .find(filter)
      .sort({
        createdAt: -1,
      });

    res.json({
      success: true,
      message: "Manage events loaded.",
      data: {
        events,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Creates a new event
export async function createEvent(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = eventSchema.parse(
      req.body
    );

    const organizer = await User.findById(
      req.user?.id
    );

    if (!organizer) {
      throw new AppError(
        "Organizer not found.",
        404
      );
    }

    const imageUrl =
      body.imageUrl || defaultEventImage;

    const event = await Event.create({
      ...body,
      imageUrl,
      date: new Date(body.date),
      gallery: body.gallery?.length
        ? body.gallery
        : [imageUrl],
      status:
        req.user?.role === "admin"
          ? "approved"
          : "pending",
      organizerId: organizer._id,
      organizerName: organizer.name,
    });

    res.status(201).json({
      success: true,
      message: "Event submitted for admin approval.",
      data: {
        event,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Deletes an event owned by the organizer or an admin
export async function deleteEvent(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const event = await Event.findById(
      req.params.id
    );

    if (!event) {
      throw new AppError(
        "Event not found.",
        404
      );
    }

    if (
      req.user?.role !== "admin" &&
      event.organizerId.toString() !== req.user?.id
    ) {
      throw new AppError(
        "You can only delete your own events.",
        403
      );
    }

    await event.deleteOne();

    res.json({
      success: true,
      message: "Event deleted.",
      data: {
        deleted: true,
      },
    });
  } catch (error) {
    next(error);
  }
}