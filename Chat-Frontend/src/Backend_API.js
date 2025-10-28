const isProduction = import.meta.env.MODE === "production";

export const BACKEND_API = isProduction
  ? import.meta.env.VITE_BACKEND_API_Production
  : import.meta.env.VITE_BACKEND_API_Localhost;
