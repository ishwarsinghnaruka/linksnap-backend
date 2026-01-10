import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import authRoutes from "./routes/auth.routes";
import urlRoutes from "./routes/url.routes";
import redirectRoutes from "./routes/redirect.routes";

// Load environment variables
dotenv.config();

// Create Express app
const app: Application = express();

// ============================================
// Middlewares
// ============================================

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : "http://localhost:3000",
    credentials: true,
  })
);

// Request logging (development only)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// Routes
// ============================================

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Auth routes
app.use("/api/auth", authRoutes);

// URL routes
app.use("/api/urls", urlRoutes);

// Redirect routes (must be last to catch all short codes)
app.use("/", redirectRoutes);

// ============================================
// Error Handling
// ============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
