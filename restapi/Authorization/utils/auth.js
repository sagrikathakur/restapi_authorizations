import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || "secret", { expiresIn: "1d" });
};

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password, hashed) => {
  return await bcrypt.compare(password, hashed);
};
