import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

// JWT Generation helper
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "24h"
  });
};

export const register = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    // 1. Check if user already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        status: "fail",
        message: "Email is already registered"
      });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Save user to database
    const result = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at",
      [email.toLowerCase(), passwordHash]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      token,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    // 1. Check if user exists
    const result = await pool.query(
      "SELECT id, email, password_hash, created_at FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        status: "fail",
        message: "Invalid email or password"
      });
    }

    const user = result.rows[0];

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        status: "fail",
        message: "Invalid email or password"
      });
    }

    const token = generateToken(user.id);

    res.status(200).json({
      status: "success",
      message: "Login successful",
      token,
      data: {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "fail",
        message: "Authorization token required"
      });
    }

    const token = authHeader.split(" ")[1];
    
    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        status: "fail",
        message: "Invalid or expired authorization token"
      });
    }

    // Retrieve user
    const result = await pool.query(
      "SELECT id, email, created_at FROM users WHERE id = $1",
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "User not found"
      });
    }

    res.status(200).json({
      status: "success",
      data: { user: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};
