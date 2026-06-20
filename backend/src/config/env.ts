import dotenv from "dotenv";
dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  PORT: parseInt(process.env.PORT || "3000", 10),
  DATABASE_URL: requireEnv("DATABASE_URL"),
  BETTER_AUTH_SECRET: requireEnv("BETTER_AUTH_SECRET"),
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  NODE_ENV: process.env.NODE_ENV || "development",
  CORS_ORIGIN:
    process.env.NODE_ENV === "production"
      ? requireEnv("CORS_ORIGIN")
      : process.env.CORS_ORIGIN || "http://localhost:5173",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "admin@example.com",
  ADMIN_PASSWORD: requireEnv("ADMIN_PASSWORD"),
} as const;
