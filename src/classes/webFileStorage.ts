import { postToWorker } from "./CloudflareWorker/WorkerUtils";
import { Project } from "./Project";


export async function uploadVideoTemp(file: File): Promise<string> {
  try {
    const form = new FormData();
    form.append("file", file);
    form.append("project_name", Project.getProject().name);
    const data = await postToWorker(form, "uploadstore/upload");
    return data.url;
  } catch (err) {
    console.error("Upload failed:", err)
    throw err
  }
}

// Server checks if url already exists/ is valid
export async function ensureUploaded(file: File): Promise<string> {
  try {
    const uploadedUrl = await uploadVideoTemp(file)
    return uploadedUrl
  } catch (err) {
    console.error("[ensureUploaded] Error ensuring file upload:", err)
    throw err
  }
}

