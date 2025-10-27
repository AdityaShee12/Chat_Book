// config.js
import dotenv from "dotenv";
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

export const BACKEND_API = isProduction
  ? process.env.BACKEND_API_Production
  : process.env.BACKEND_API_Localhost ;