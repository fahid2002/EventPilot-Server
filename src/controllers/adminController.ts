import type {
  Request,
  Response,
  NextFunction,
} from "express";
import { Event } from "../models/Event";
import { User } from "../models/User";
import { Attendance } from "../models/Attendance";
import { Payment } from "../models/Payment";
import { Review } from "../models/Review";
import { SavedEvent } from "../models/SavedEvent";
import { AppError } from "../middleware/error";

// Loads all pending events for admin review
export async function pendingEvents(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const events = await Event
      .find({
        status: "pending",
      })
      .sort({
        createdAt: -1,
      });

    res.json({
      success: true,
      message: "Pending events loaded.",
      data: {
        events,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Approves or rejects an event
export async function updateEventStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      throw new AppError(
        "Status must be approved or rejected.",
        400
      );
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      {
        status,
      },
      {
        new: true,
      }
    );

    if (!event) {
      throw new AppError("Event not found.", 404);
    }

    res.json({
      success: true,
      message: `Event ${status}.`,
      data: {
        event,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Loads the latest 100 users
export async function listUsers(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const users = await User
      .find({
        role: {
          $in: ["user", "organizer"],
        },
      })
      .sort({
        createdAt: -1,
      })
      .limit(100);
    const userCount = users.filter((user) => user.role === "user").length;
    const organizerCount = users.filter((user) => user.role === "organizer").length;

    res.json({
      success: true,
      message: "Users loaded.",
      data: {
        users,
        counts: {
          users: userCount,
          organizers: organizerCount,
          total: users.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

// Updates a user's account role
export async function updateUserRole(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { role } = req.body;

    if (!["user", "organizer"].includes(role)) {
      throw new AppError("Role must be user or organizer.", 400);
    }

    if (req.params.id === req.user?.id) {
      throw new AppError("You cannot change your own admin role from the dashboard.", 400);
    }

    const existing = await User.findById(req.params.id);

    if (!existing) {
      throw new AppError("User not found.", 404);
    }

    const duplicate = await User.findOne({
      _id: {
        $ne: existing._id,
      },
      email: existing.email,
      role,
    });

    if (duplicate) {
      throw new AppError(`This email already has a ${role} account. Delete the duplicate first or choose another role.`, 409);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        role,
        membership: role === "organizer" ? "premium" : existing.membership,
      },
      {
        new: true,
      }
    );

    if (!user) {
      throw new AppError("User not found.", 404);
    }

    res.json({
      success: true,
      message: "User role updated.",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (req.params.id === req.user?.id) {
      throw new AppError("You cannot delete your own admin account from the dashboard.", 400);
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      throw new AppError("User not found.", 404);
    }

    await Promise.all([
      SavedEvent.deleteMany({
        userId: user._id,
      }),
      Attendance.deleteMany({
        userId: user._id,
      }),
      Review.deleteMany({
        userId: user._id,
      }),
      Payment.deleteMany({
        userId: user._id,
      }),
      Event.deleteMany({
        organizerId: user._id,
      }),
      user.deleteOne(),
    ]);

    res.json({
      success: true,
      message: "User deleted.",
      data: {
        deleted: true,
      },
    });
  } catch (error) {
    next(error);
  }
}
