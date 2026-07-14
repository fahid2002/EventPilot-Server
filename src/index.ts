import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import { authRoutes } from "./routes/authRoutes";
import { eventRoutes } from "./routes/eventRoutes";
import { userRoutes } from "./routes/userRoutes";
import { paymentRoutes } from "./routes/paymentRoutes";
import { adminRoutes } from "./routes/adminRoutes";
import { handleStripeWebhook } from "./controllers/paymentController";
import { errorHandler, notFound } from "./middleware/error";
import { User } from "./models/User";

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
app.use(express.json({ limit: "2mb" }));

app.get("/", (_req, res) => {
  res.json({ success: true, message: "EventPilot API is running." });
});

app.get("/api/health", (_req, res) => {
  res.json({ success: true, status: "ok", service: "eventpilot-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

connectDB()
  .then(() => {
    return User.syncIndexes();
  })
  .then(() => {
    app.listen(port, () => console.log(`EventPilot API listening on port ${port}`));
  })
  .catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
  });
