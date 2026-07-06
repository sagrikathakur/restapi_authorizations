import express from "express";
import { z } from "zod";
import { register, login, me } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

// Validation Schemas
const registerSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long")
});

const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required")
});

// Routes
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", me);

export default router;
