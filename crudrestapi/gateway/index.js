import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import proxy from "express-http-proxy";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;
const AUTH_SERVICE_URL = `http://localhost:${process.env.AUTH_PORT || 3001}`;
const FOOD_SERVICE_URL = `http://localhost:${process.env.FOOD_PORT || 3002}`;

// Security Headers
app.use(helmet());

// CORS Configuration
app.use(cors({
  origin: "*", // Adjust this to specific domains in production
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Request Logging
app.use(morgan("dev"));

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    status: 429,
    message: "Too many requests from this IP, please try again after 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 register/login requests per window
  message: {
    status: 429,
    message: "Too many authentication requests, please try again after 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limits
app.use("/api/v1/auth", authLimiter);
app.use("/api/v1/food", generalLimiter);

// Gateway Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "API Gateway",
    timestamp: new Date()
  });
});

// Proxy routes to Microservices
app.use("/api/v1/auth", proxy(AUTH_SERVICE_URL, {
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    // Preserve authorization headers if passed
    return proxyReqOpts;
  },
  proxyErrorHandler: (err, res, next) => {
    res.status(503).json({
      status: 503,
      message: "Authentication Service is currently unavailable.",
      error: err.message
    });
  }
}));

app.use("/api/v1/food", proxy(FOOD_SERVICE_URL, {
  proxyErrorHandler: (err, res, next) => {
    res.status(503).json({
      status: 503,
      message: "Food Service is currently unavailable.",
      error: err.message
    });
  }
}));

// Fallback for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    message: "Route not found in API Gateway."
  });
});

app.listen(PORT, () => {
  console.log(`[Gateway] API Gateway running on port ${PORT}`);
  console.log(`[Gateway] Routing /api/v1/auth -> ${AUTH_SERVICE_URL}`);
  console.log(`[Gateway] Routing /api/v1/food -> ${FOOD_SERVICE_URL}`);
});
