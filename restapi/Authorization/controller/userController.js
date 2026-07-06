import { hashPassword, comparePassword, generateToken } from "../utils/auth.js";
import * as db from "../models/userModel.js";

export const register = async (req, res) => {
  try {
    const { first_name, last_name, email, password, role } = req.body;
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existing = await db.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await db.createUser({
      first_name,
      last_name,
      email,
      password: hashedPassword,
      role
    });

    return res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user.id, user.role);
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const profile = async (req, res) => {
  try {
    const user = await db.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
