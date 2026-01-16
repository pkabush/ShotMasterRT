


export async function uploadVideoTemp(file: File): Promise<string> {
  try {
    console.log("[tmpfiles] Uploading:", file.name)

    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("https://tmpfiles.org/api/v1/upload", {
      method: "POST",
      body: formData
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const json = await res.json()
    console.log("[tmpfiles] Response:", json)

    const url = json?.data?.url
    if (!url) throw new Error("No URL returned")

    // IMPORTANT: Kling needs direct file access
    return url.replace("tmpfiles.org/", "tmpfiles.org/dl/")
  } catch (err) {
    console.error("[tmpfiles] Upload failed:", err)
    throw err
  }
}

/**
 * Check if local file matches tmpfiles URL by filename only
 */
export function checkFileByName(file: File, url: string): boolean {
  try {
    // Extract filename from URL
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split("/")
    const remoteName = pathParts[pathParts.length - 1]

    const nameMatches = file.name === remoteName

    console.log("[checkFileByName]", {
      localName: file.name,
      remoteName,
      nameMatches
    })

    return nameMatches
  } catch (err) {
    console.error("[checkFileByName] Error:", err)
    return false
  }
}

/**
 * Check if URL is valid for the given file; upload if not
 */
export async function ensureUploaded(file: File, url?: string): Promise<string> {
  try {
    // Helper: check if the file matches the URL (case-insensitive, URL-decoded)
    const checkFileByName = (file: File, url: string) => {
      const fileName = file.name.toLowerCase()
      const urlFileName = decodeURIComponent(url.split("/").pop() || "").toLowerCase()
      return fileName === urlFileName
    }

    // If a URL is provided, check if it matches the local file
    if (url && checkFileByName(file, url)) {
      console.log("[ensureUploaded] Existing URL is valid:", url)
      return url
    }

    // Otherwise, upload the file
    console.log("[ensureUploaded] Uploading file because URL is missing or invalid:", file.name)
    const uploadedUrl = await uploadVideoTemp(file)
    console.log("[ensureUploaded] Uploaded URL:", uploadedUrl)
    return uploadedUrl
  } catch (err) {
    console.error("[ensureUploaded] Error ensuring file upload:", err)
    throw err
  }
}