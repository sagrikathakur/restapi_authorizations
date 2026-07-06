import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const authSchema = z.object({
  user_id: z.string().min(1),
  role: z.string().min(1),
  permission: z.string().min(1)
});
