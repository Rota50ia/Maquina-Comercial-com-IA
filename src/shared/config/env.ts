import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  WEBHOOK_SECRET: z.string().optional(),
  APP_ORIGIN: z.string().default("*"),
  DASHBOARD_USER: z.string().optional(),
  DASHBOARD_PASSWORD: z.string().optional(),
  UAZAPI_BASE_URL: z.string().url().optional(),
  UAZAPI_TOKEN: z.string().optional(),
});

export const env = envSchema.parse(process.env);
