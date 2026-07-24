import { useGoogleStore, WORKER_URL } from "../contexts/GoogleUserContext";
import { Project } from "./Project";


export async function uploadVideoTemp(file: File): Promise<string> {
  try {
    const form = new FormData();
    form.append("file", file);
    form.append("project_name", Project.getProject().name);

    const idToken = useGoogleStore.getState().idToken;

    const response = await fetch(`${WORKER_URL}/uploadstore/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      body: form,
    });

    const data = await response.json();
    return data.url;

  } catch (err) {
    console.error("[tmpfiles] Upload failed:", err)
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

