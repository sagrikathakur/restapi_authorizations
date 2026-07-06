import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { initDatabase } from "./config/db.js";
import authRouter from "./routes/userRoutes.js";

dotenv.config();

const server = express();
const port = process.env.PORT || 5000;

server.use(cors());
server.use(cookieParser());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

server.get("/", (req, res) => {
  res.send("Authorization Server is running");
});

server.use("/api/auth", authRouter);

server.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  try {
    await initDatabase();
  } catch (error) {
    console.error("Database init failed:", error);
  }
});

