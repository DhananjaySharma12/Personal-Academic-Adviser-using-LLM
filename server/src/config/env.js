/**
 * env.js — validates all required environment variables at startup.
 * Server refuses to start if any P0 variable is missing or malformed.
 */
import { z } from 'zod'
import dotenv from 'dotenv'
dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),

  // MongoDB
  MONGO_URI: z.string().url({ message: 'MONGO_URI must be a valid MongoDB connection string' }),

  // JWT
  JWT_SECRET: z.string().min(32, { message: 'JWT_SECRET must be at least 32 characters' }),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // LLM provider — values come ONLY from env, never hardcoded
  LLM_PROVIDER: z.enum(['gemini', 'openai']).default('gemini'),
  LLM_API_KEY: z.string().min(1, { message: 'LLM_API_KEY is required' }),
  LLM_MODEL: z.string().default('gemini-3.8-flash'),
  EMBEDDING_MODEL: z.string().default('gemini-embedding-001'),

  // CORS — comma-separated list of allowed origins
  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  // Upload limits (bytes)
  MAX_FILE_SIZE_BYTES: z.coerce.number().default(10 * 1024 * 1024), // 10 MB
  UPLOAD_DIR: z.string().default('uploads'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('\n❌ Invalid environment variables:\n')
  parsed.error.issues.forEach((issue) => {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`)
  })
  console.error('\n  → Fix your server/.env file and restart.\n')
  process.exit(1)
}

export const env = parsed.data
