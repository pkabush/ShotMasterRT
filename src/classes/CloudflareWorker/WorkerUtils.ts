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

        //console.log("ID_TOKEN",idToken);

        const params = new URLSearchParams({
            project_name: project.name,
            ...additional_url_params,
        });

        const res = await fetch(`${WORKER_URL}/${subpath}?${params}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${idToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        
        const response = await res.json();

        // STORE COSTS
        if (response.cost && response.id && response.provider) {
            project.costTracker?.addCost(response.id ?? "", response.provider, response.cost );
        }

    return response;

    } catch (err) {
        console.error(`Worker error (${subpath})`, err);
        throw err;
    }
}