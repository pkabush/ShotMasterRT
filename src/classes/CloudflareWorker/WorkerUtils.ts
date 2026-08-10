import { useGoogleStore, WORKER_URL } from "../../contexts/GoogleUserContext";
import { Project } from "../Project";

export async function postToWorker(
    payload: any,
    subpath: string,
    additional_url_params: Record<string, string> = {}
) {
    try {
        const idToken = useGoogleStore.getState().idToken;
        const project = Project.getProject();

        const params = new URLSearchParams({
            project_name: project.name,
            ...additional_url_params,
        });

        const headers: Record<string, string> = {
            Authorization: `Bearer ${idToken}`,
        };

        let body: BodyInit;

        if (payload instanceof FormData) {
            // Let the browser set multipart/form-data + boundary
            body = payload;
        } else {
            headers["Content-Type"] = "application/json";
            body = JSON.stringify(payload);
        }

        const res = await fetch(`${WORKER_URL}/${subpath}?${params}`, {
            method: "POST",
            headers,
            body,
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }

        const response = await res.json();

        // STORE COSTS
        if (response.cost && response.id && response.provider) {
            project.costTracker?.addCost(
                response.id,
                response.provider,
                response.cost
            );
        }

        return response;
    } catch (err) {
        console.error(`Worker error (${subpath})`, err);
        throw err;
    }
}