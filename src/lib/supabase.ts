import { createClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"

let supabaseAdmin: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin() {
  if (supabaseAdmin) {
    return supabaseAdmin
  }

  const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL!

  supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return supabaseAdmin
}

export const COVERS_BUCKET = "covers"
export const IMAGES_BUCKET = "images"

const ensuredBuckets = new Set<string>()

export async function ensureBucketExists(bucketName: string): Promise<void> {
  if (ensuredBuckets.has(bucketName)) return

  const supabase = getSupabaseAdmin()
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.some((b) => b.name === bucketName)
  if (!exists) {
    await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 50 * 1024 * 1024,
    })
  }
  ensuredBuckets.add(bucketName)
}
