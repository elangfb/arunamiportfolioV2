// File upload service (P4). One call for screens to upload a proof / KYC doc.
// Firebase mode: uploads to Cloud Storage, returns the download URL.
// Mock mode: no backend — returns an in-session object URL for preview.
import { firebaseEnabled, firebaseApp } from './firebase'

export interface UploadResult { name: string; url: string }

const MAX_MB = 10
const ALLOWED = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']

/** Returns an error message if the file is invalid, else null. */
export function validateFile(file: File): string | null {
  if (file.size > MAX_MB * 1024 * 1024) return `File terlalu besar (maks ${MAX_MB}MB)`
  if (!ALLOWED.includes(file.type)) return 'Tipe file harus PDF, PNG, JPG, atau WEBP'
  return null
}

export async function uploadFile(path: string, file: File): Promise<UploadResult> {
  const err = validateFile(file)
  if (err) throw new Error(err)

  if (firebaseEnabled && firebaseApp) {
    const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage')
    const storage = getStorage(firebaseApp)
    const fileRef = ref(storage, `${path}/${Date.now()}-${file.name}`)
    await uploadBytes(fileRef, file)
    return { name: file.name, url: await getDownloadURL(fileRef) }
  }

  // Mock: ephemeral preview URL (not persisted — prototype only).
  return { name: file.name, url: URL.createObjectURL(file) }
}
