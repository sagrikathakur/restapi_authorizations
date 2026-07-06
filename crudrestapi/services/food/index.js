import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./src/config/db.js";
import foodRoutes from "./src/routes/foodRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();
const PORT = process.env.FOOD_PORT || 3002;

app.use(express.json());

// Verify Database Connection on startup
const checkDB = async () => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("[Food-Service] Database connection check succeeded at:", res.rows[0].now);
  } catch (error) {
    console.error("[Food-Service] Database connection check failed:", error);
    process.exit(1);
  }
};

await checkDB();

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", service: "Food Service" });
});

// Register routes
app.use("/", foodRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("[Food-Service Error]", err.stack || err);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal server error"
  });
});

app.listen(PORT, () => {
  console.log(`[Food-Service] Food Service running on port ${PORT}`);
});
