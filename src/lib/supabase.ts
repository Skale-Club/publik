import { createClient } from "@supabase/supabase-js"

let supabaseAdmin: ReturnType<typeof createClient> | null = null

function getSupabaseUrl(): string {
  return process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
}

function getSupabaseServiceKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
}

export function getSupabaseAdmin() {
  if (supabaseAdmin) {
    return supabaseAdmin
  }

  const supabaseUrl = getSupabaseUrl()
  const supabaseServiceKey = getSupabaseServiceKey()

  if (!supabaseUrl) {
    throw new Error("Missing Supabase URL. Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.")
  }

  if (!supabaseServiceKey) {
    throw new Error("Missing Supabase service role key. Set SUPABASE_SERVICE_ROLE_KEY.")
  }

  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return supabaseAdmin
}

export const COVERS_BUCKET = "covers"
export const IMAGES_BUCKET = "images"

export async function ensureBucketExists(bucketName: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.some((b) => b.name === bucketName)
  if (!exists) {
    await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 50 * 1024 * 1024,
    })
  }
}
