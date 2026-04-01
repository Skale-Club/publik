import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export const COVERS_BUCKET = "covers"
export const IMAGES_BUCKET = "images"

export async function ensureBucketExists(bucketName: string): Promise<void> {
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.some((b) => b.name === bucketName)
  if (!exists) {
    await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 50 * 1024 * 1024,
    })
  }
}
