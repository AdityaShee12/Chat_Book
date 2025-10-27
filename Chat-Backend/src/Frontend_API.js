// config.js
import dotenv from "dotenv";
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
export const FRONTEND_API = isProduction
  ? process.env.FRONTEND_API_Production
  : process.env.FRONTEND_API_Localhost;