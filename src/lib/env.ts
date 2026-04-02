import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SUPABASE_URL: z
    .string()
    .min(1)
    .optional()
    .or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .min(1)
    .optional()
    .or(z.literal("")),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  KEEPALIVE_SECRET: z.string().optional(),
})

function validateEnv() {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n")
    throw new Error(`Missing or invalid environment variables:\n${missing}`)
  }
  // At least one Supabase URL must be set
  const { SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL } = parsed.data
  if (!SUPABASE_URL && !NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error(
      "Missing environment variable: set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL"
    )
  }
  return parsed.data
}

export const env = validateEnv()
