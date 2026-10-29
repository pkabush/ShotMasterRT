import { create } from "zustand";
import { TasksJson } from "../classes/Task";
import { Project } from "../classes/Project";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink, faLinkSlash } from "@fortawesome/free-solid-svg-icons";
import { Button } from "react-bootstrap";

const test_web = false;

const WORKER_WS_URL =
    import.meta.env.DEV && !test_web
        ? "ws://localhost:8787"
        : "wss://shotmasterworker.kabushpavel.workers.dev";

interface WebSocketStore {
    status:
    | "disconnected"
    | "connecting"
    | "connected"
    | "reconnecting"
    | "error";

    connect: () => void;
    disconnect: () => void;
}

let workerSocket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let manuallyDisconnected = false;

const RECONNECT_DELAY = 2000;

export const useWebSocketStore = create<WebSocketStore>((set, get) => ({
    status: "disconnected",

    connect: () => {
        // Avoid duplicate connections.
        if (
            workerSocket &&
            (workerSocket.readyState === WebSocket.OPEN ||
                workerSocket.readyState === WebSocket.CONNECTING)
        ) {
            return;
        }

        manuallyDisconnected = false;

        // Clear any pending reconnect attempt.
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }

        set({ status: "connecting" });

        const socket = new WebSocket(`${WORKER_WS_URL}/ws`);
        workerSocket = socket;

        socket.onopen = () => {
            // Ignore events from an obsolete socket.
            if (workerSocket !== socket) return;

            console.log("[WEBSOCKET] Worker websocket connected");
            set({ status: "connected" });
        };

        socket.onmessage = (event) => {
            if (workerSocket !== socket) return;

            const message = JSON.parse(event.data);

            console.log("[WEBSOCKET] Worker message:", message);

            if (message.type === "task_status") {
                const task = TasksJson.getTaskById(message.data.id);

                task?.update(message.data);

                if (message.data.url) {
                    //task?.downloadResults();
                    setTimeout(() => { task?.downloadResults(); }, 1000);
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

        socket.onerror = (err) => {
            console.error("[WEBSOCKET] Worker websocket error", err);
            set({ status: "error" });

            // The close event will handle reconnection.
        };

        socket.onclose = () => {
            if (workerSocket !== socket) return;

            console.log("[WEBSOCKET] Worker websocket closed");
            workerSocket = null;

            if (manuallyDisconnected) {
                set({ status: "disconnected" });
                return;
            }

            set({ status: "reconnecting" });

            console.log(
                `[WEBSOCKET] Reconnecting in ${RECONNECT_DELAY / 1000} seconds...`
            );

            reconnectTimer = setTimeout(() => {
                reconnectTimer = null;

                if (!manuallyDisconnected) {
                    get().connect();
                }
            }, RECONNECT_DELAY);
        };
    },

    disconnect: () => {
        manuallyDisconnected = true;

        // Prevent a scheduled reconnect.
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }

        const socket = workerSocket;
        workerSocket = null;

        if (socket) {
            socket.close();
        }

        set({ status: "disconnected" });
    },
}));



export function ConnectWorkerButton() {
    const status = useWebSocketStore((s) => s.status);
    const connect = useWebSocketStore((s) => s.connect);
    const disconnect = useWebSocketStore((s) => s.disconnect);

    const connected =
        status === "connected" || status === "connecting";
    const connecting = status === "connecting";
    const reconnecting = status === "reconnecting";
    const pending = connecting || reconnecting;

    return (
        <>
            {pending && (
                <style>
                    {`
                        @keyframes reconnect-fill {
                            to {
                                stroke-dashoffset: 0;
                            }
                        }

                        @keyframes connect-breathe {
                            0%, 100% {
                                box-shadow: 0 0 0 0 rgba(13, 110, 253, 0.15);
                            }
                            50% {
                                box-shadow: 0 0 0 5px rgba(13, 110, 253, 0.25);
                            }
                        }
                    `}
                </style>
            )}

            <Button
                onClick={() => {
                    if (connected || reconnecting) {
                        disconnect();
                    } else {
                        connect();
                    }
                }}
                variant={
                    pending
                        ? "outline-primary"
                        : connected
                            ? "outline-success"
                            : "outline-secondary"
                }
                title={
                    reconnecting
                        ? "Cancel reconnect and disconnect"
                        : connecting
                            ? "Cancel connection"
                            : connected
                                ? "Disconnect worker"
                                : "Connect worker"
                }
                style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    overflow: "visible",
                    ...(connecting
                        ? {
                            animation: "connect-breathe 1.5s ease-in-out infinite",
                        }
                        : {}),
                }}
            >
                {reconnecting && (
                    <svg
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            width: 50,
                            height: 50,
                            top: -4,
                            left: -4,
                            pointerEvents: "none",
                            overflow: "visible",
                        }}
                    >
                        <circle
                            cx="24"
                            cy="24"
                            r="21"
                            fill="none"
                            stroke="rgba(13, 110, 253, 0.15)"
                            strokeWidth="2.5"
                        />

                        <circle
                            cx="24"
                            cy="24"
                            r="21"
                            fill="none"
                            stroke="#0d6efd"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 21}
                            strokeDashoffset={2 * Math.PI * 21}
                            style={{
                                animation: `reconnect-fill ${RECONNECT_DELAY}ms linear forwards`,
                            }}
                        />
                    </svg>
                )}

                <FontAwesomeIcon
                    icon={connected ? faLink : faLinkSlash}
                    spin={false}
                />
            </Button>
        </>
    );
}