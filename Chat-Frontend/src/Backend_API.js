const isProduction = import.meta.env.MODE === "production";
console.log(import.meta.env.VITE_BACKEND_API_Production);

export const BACKEND_API = isProduction
  ? import.meta.env.VITE_BACKEND_API_Production
  : import.meta.env.VITE_BACKEND_API_Localhost;
