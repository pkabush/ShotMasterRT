
import { create } from "zustand";
import { TasksJson } from "../classes/Task";
import { Project } from "../classes/Project";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink, faLinkSlash } from "@fortawesome/free-solid-svg-icons";
import { Button } from "react-bootstrap";

const test_web = false

const WORKER_WS_URL =
    import.meta.env.DEV && !test_web
        ? "ws://localhost:8787"
        : "wss://shotmasterworker.kabushpavel.workers.dev";



interface WebSocketStore {
    status:
    | "disconnected"
    | "connecting"
    | "connected"
    | "error";

    connect: () => void;
    disconnect: () => void;
}

let workerSocket: WebSocket | null = null;

export const useWebSocketStore = create<WebSocketStore>((set) => ({
    status: "disconnected",

    connect: () => {
        if (
            workerSocket &&
            workerSocket.readyState === WebSocket.OPEN
        ) {
            return;
        }

        set({ status: "connecting" });

        workerSocket = new WebSocket(`${WORKER_WS_URL}/ws`);

        workerSocket.onopen = () => {
            console.log("Worker websocket connected");
            set({ status: "connected" });
        };

        workerSocket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            console.log("Worker message:", message);

            if (message.type === "task_status") {
                const task = TasksJson.getTaskById(
                    message.data.id
                );

                task?.update(message.data);

                if (message.data.url) {
                    task?.downloadResults();
                }

                if (message.data.cost) {
                    const proj = Project.getProject();

                    proj.costTracker?.addCost(
                        message.data.id,
                        message.data.provider,
                        message.data.cost,
                        {
                            task_data: message.data,
                        }
                    );
                }
            }
        };

        workerSocket.onerror = (err) => {
            console.error(
                "Worker websocket error",
                err
            );

            set({ status: "error" });
        };

        workerSocket.onclose = () => {
            console.log(
                "Worker websocket closed"
            );

            workerSocket = null;

            set({
                status: "disconnected",
            });
        };
    },

    disconnect: () => {
        if (workerSocket) {
            workerSocket.close();
            workerSocket = null;
        }

        set({
            status: "disconnected",
        });
    },
}));




export function ConnectWorkerButton() {
    const status = useWebSocketStore((s) => s.status);
    const connect = useWebSocketStore((s) => s.connect);
    const disconnect = useWebSocketStore((s) => s.disconnect);
    const connected = status === "connected" || status === "connecting";

    return (
        <Button
            onClick={() => {
                if (connected) { disconnect(); } else { connect(); }
            }}
            variant={connected ? "outline-success" : "outline-secondary"}
            title={connected ? "Disconnect worker" : "Connect worker"}
            style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <FontAwesomeIcon icon={connected ? faLink : faLinkSlash} />
        </Button>
    );
}