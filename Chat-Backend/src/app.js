import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js"; // User Routes Import
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import "./OAuth20.js";
import { API } from "./Frontend_API.js";

const app = express();

// Middleware Setup
app.use(cors({ origin: API, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.get("/",(req,res)=>{
    res.send("API is running successfully")
})
app.use("/api/v1/users", userRouter);
app.use("/auth", authRoutes);
app.use("/api", profileRoutes);
export { app };
