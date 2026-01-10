import app from "./app";
import pool from "./config/database";

const PORT = process.env.PORT || 5000;

/**
 * Test database connection
 */
const testDatabaseConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    console.log("✅ Database connection test successful");
    console.log("   Server time:", result.rows[0].now);
    client.release();
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};

/**
 * Start server
 */
const startServer = async () => {
  try {
    // Test database connection
    await testDatabaseConnection();

    // Start Express server
    app.listen(PORT, () => {
      console.log("");
      console.log("🚀 ================================");
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🚀 Environment: ${process.env.NODE_ENV}`);
      console.log(`🚀 Health check: http://localhost:${PORT}/health`);
      console.log("🚀 ================================");
      console.log("");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err: Error) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

// Start the server
startServer();
