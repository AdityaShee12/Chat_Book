const isProduction = import.meta.env.MODE === "production";
console.log(import.meta.env.VITE_Production);

export const BACKEND_API = isProduction
  ? import.meta.env.VITE_Production
  : import.meta.env.VITE_Localhost;
