import type {
  ErrorRequestHandler,
  RequestHandler,
} from "express";

// Custom application error with an HTTP status code
export class AppError extends Error {
  statusCode: number;

  constructor(
    message: string,
    statusCode = 400
  ) {
    super(message);

    this.statusCode = statusCode;
  }
}

// Handles requests made to routes that do not exist
export const notFound: RequestHandler = (
  req,
  _res,
  next
) => {
  next(
    new AppError(
      `Route not found: ${req.originalUrl}`,
      404
    )
  );
};

// Handles application errors and sends a JSON response
export const errorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next
) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Server error",
  });
};