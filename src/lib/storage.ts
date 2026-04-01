import { supabase, COVERS_BUCKET, IMAGES_BUCKET, ensureBucketExists } from "./supabase"
import { nanoid } from "nanoid"

function getExt(name: string): string {
  const parts = name.split(".")
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : ""
}

export async function saveImage(
  file: File,
  bookId: string,
): Promise<{ url: string }> {
  await ensureBucketExists(IMAGES_BUCKET)

  const ext = getExt(file.name)
  const filename = `${nanoid()}${ext}`
  const path = `${bookId}/${filename}`

  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage
    .from(IMAGES_BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  const { data: urlData } = supabase.storage
    .from(IMAGES_BUCKET)
    .getPublicUrl(path)

  return { url: urlData.publicUrl }
}

export async function saveCoverImage(
  file: File,
  bookId: string,
  coverType: "front" | "back",
): Promise<{ url: string }> {
  await ensureBucketExists(COVERS_BUCKET)

  const ext = getExt(file.name)
  const filename = `${coverType}${ext}`
  const path = `${bookId}/${filename}`

  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage
    .from(COVERS_BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (error) {
    throw new Error(`Cover upload failed: ${error.message}`)
  }

  const { data: urlData } = supabase.storage
    .from(COVERS_BUCKET)
    .getPublicUrl(path)

  return { url: urlData.publicUrl }
}

export async function deleteFile(bucketName: string, path: string): Promise<void> {
  await supabase.storage.from(bucketName).remove([path])
}
