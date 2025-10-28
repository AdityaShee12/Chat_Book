const isProduction = import.meta.env.NODE === "production";

export const BACKEND_API = isProduction
  ? import.meta.env.Vite_BACKEND_API_Production
  : import.meta.env.Vite_BACKEND_API_Localhost;
