import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import siteRoutes from "./routes/siteRoutes.js";
import inspectionRoutes from "./routes/inspectionRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

// Builds and returns the configured Express app, without connecting to
// the database or starting a listener. Kept separate from server.js so
// tests can import the app directly (via supertest) against an
// in-memory test database, without booting a real server or touching
// production data.
export function createApp() {
  const app = express();

  // In development, CORS_ORIGIN is unset and we allow any origin.
  // In production, set CORS_ORIGIN to your deployed frontend URL(s)
  // (comma-separated for multiple) so only your own client can call this API.
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
    : null;

  app.use(
    cors({
      origin: allowedOrigins || true,
    })
  );
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/sites", siteRoutes);
  app.use("/api/inspections", inspectionRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/dashboard", dashboardRoutes);

  // 404 handler for any unmatched API route.
  app.use((req, res) => {
    res.status(404).json({ message: "Route not found." });
  });

  // Centralized error handler -- catches anything thrown or passed to
  // next(err) that individual route handlers didn't already respond to.
  app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(err.status || 500).json({
      message: err.message || "Something went wrong on the server.",
    });
  });

  return app;
}
