import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();
const PORT = process.env.AUTH_PORT || 3001;

app.use(express.json());

// Initialize Database Table
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("[Auth-Service] Initialized 'users' table successfully");
  } catch (error) {
    console.error("[Auth-Service] Failed to initialize 'users' table:", error);
    process.exit(1);
  }
};

await initDB();

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", service: "Auth Service" });
});

// Register routes
app.use("/", authRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("[Auth-Service Error]", err.stack || err);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal server error"
  });
});

app.listen(PORT, () => {
  console.log(`[Auth-Service] Auth Service running on port ${PORT}`);
});
