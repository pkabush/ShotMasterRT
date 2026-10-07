import { useDebugStore } from "../../contexts/DebugStore";
import { useUserStore, WORKER_URL } from "../../contexts/GoogleUserContext";
import { Project } from "../Project";



export async function postToWorker(
    payload: any,
    subpath: string,
    additional_url_params: Record<string, string> = {},
    responseType: "json" | "blob" = "json",
) {
    try {
        const debug_log = useDebugStore.getState().debug_log ? "true" : "false";
        const username = useUserStore.getState().user?.name ?? "";
        const project = Project.getProject();

        const params = new URLSearchParams({
            project_name: project.name,
            username,
            debug_log,
            ...additional_url_params,
        });

        const headers: Record<string, string> = {};

        let body: BodyInit;

        if (payload instanceof FormData) {
            body = payload;
        } else {
            headers["Content-Type"] = "application/json";
            body = JSON.stringify(payload);
        }

        const res = await fetch(`${WORKER_URL}/${subpath}?${params}`, {
            method: "POST",
            headers,
            body,
            credentials: "include",
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }

        // TRY TO READ COST FROM HEADERS
        const headerCost = res.headers.get("x-cost");
        const headerProvider = res.headers.get("x-provider");
        const headerTaskId = res.headers.get("x-task-id");
        console.log("Headers", headerCost, headerProvider, headerTaskId);
        

        // Return binary response when requested.
        if (responseType === "blob") {
            return await res.blob();
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


export async function getFromWorker(
    subpath: string,
    additional_url_params: Record<string, string> = {}
) {
    try {
        const params = new URLSearchParams(additional_url_params);
        const query = params.toString();

        const url = query
            ? `${WORKER_URL}/${subpath}?${query}`
            : `${WORKER_URL}/${subpath}`;

        const res = await fetch(url, {
            method: "GET",
            credentials: "include",
        });

        if (!res.ok) { throw new Error(await res.text()); }
        const contentType = res.headers.get("content-type") ?? "";

        if (contentType.includes("application/json")) {
            return await res.json();
        }

        return await res.text();

    } catch (err) {
        console.error(`Worker error (${subpath})`, err);
        throw err;
    }
}


export async function loginToWorker(
    googleIdToken: string
) {
    try {
        const res = await fetch(`${WORKER_URL}/auth/login`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${googleIdToken}`,
            },
            credentials: "include",
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }

        return await res.json();

    } catch (err) {
        console.error("Worker login error", err);
        throw err;
    }
}

export async function getWorkerUser() {
    const response = await fetch(`${WORKER_URL}/auth/user`, {
        method: "GET",
        credentials: "include",
    });
    if (!response.ok) { return null; }
    const data = await response.json();
    return data.user;
}