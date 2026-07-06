import express from "express";
import { z } from "zod";
import {
  createFood,
  getAllFoods,
  getFoodById,
  updateFood,
  deleteFood
} from "../controllers/foodController.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Validation Schema for creating/updating food
const foodSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().nullable().optional(),
  price: z.number().positive("Price must be a positive number").nullable().optional(),
  carbs: z.number().int().nonnegative("Carbs must be a non-negative integer").nullable().optional(),
  origin_country: z.string().nullable().optional()
});

// Public read routes
router.get("/", getAllFoods);
router.get("/:id", getFoodById);

// Protected modification routes (require JWT auth)
router.post("/", requireAuth, validate(foodSchema), createFood);
router.put("/:id", requireAuth, validate(foodSchema), updateFood);
router.delete("/:id", requireAuth, deleteFood);

export default router;
