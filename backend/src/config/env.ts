import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || "3000", 10),
  DATABASE_URL: process.env.DATABASE_URL || "",
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || "default-secret",
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
  NODE_ENV: process.env.NODE_ENV || "development",
} as const;
