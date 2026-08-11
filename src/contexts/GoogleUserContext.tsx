import { create } from "zustand";
import { jwtDecode } from "jwt-decode";
import {
  GoogleLogin,
} from "@react-oauth/google";
import { TasksJson } from "../classes/Task";
import { Project } from "../classes/Project";
import { Button, OverlayTrigger, Popover, Stack } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink, faLinkSlash, faUser } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";

//export const WORKER_URL = "http://localhost:8787";
//export const WORKER_URL = "https://shotmasterworker.kabushpavel.workers.dev";

const test_web = false

export const WORKER_URL =
  import.meta.env.DEV && !test_web
    ? "http://localhost:8787"
    : "https://shotmasterworker.kabushpavel.workers.dev";


const WORKER_WS_URL =
  import.meta.env.DEV && !test_web
    ? "ws://localhost:8787"
    : "wss://shotmasterworker.kabushpavel.workers.dev";


interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
}


interface GoogleStore {
  user: GoogleUser | null;
  idToken: string | null;
  idTokenExpiresAt: number | null;
  driveAccessToken: string | null;

  websocketStatus:
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

  login: (credential: string) => void;
  logout: () => void;

  connectWorkerWebSocket: (userId: string) => void;
  disconnectWorkerWebSocket: () => void;
}

let workerSocket: WebSocket | null = null;

export const useGoogleStore = create<GoogleStore>(
  (set, get) => ({
    user: null,
    idToken: null,
    idTokenExpiresAt: null,
    driveAccessToken: null,

    websocketStatus: "disconnected",

    login: (credential: string) => {
      const decoded = jwtDecode<any>(credential);

      const user = {
        id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
      };

      set({
        idToken: credential,
        idTokenExpiresAt: decoded.exp ? decoded.exp * 1000 : null,
        user,
      });

      // connect after login
      get().connectWorkerWebSocket(user.email);
    },

    logout: () => {
      get().disconnectWorkerWebSocket();
      set({
        user: null,
        driveAccessToken: null,
        idToken: null,
        idTokenExpiresAt: null,
      });
    },

    connectWorkerWebSocket: (userId: string) => {

      if (
        workerSocket &&
        workerSocket.readyState === WebSocket.OPEN
      ) {
        return;
      }

      set({
        websocketStatus: "connecting",
      });

      workerSocket = new WebSocket(
        `${WORKER_WS_URL}/ws/${userId}`
      );

      workerSocket.onopen = () => {
        console.log("Worker websocket connected");
        set({
          websocketStatus: "connected",
        });
      };

      workerSocket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log("Worker message:", message);

        // handle messages here

        // UPDATE TASK STATUS
        if (message.type == "task_status") {
          // Find Task
          const task = TasksJson.getTaskById(message.data.id);
          // Update Task Status
          task?.update(message.data);
          if (message.data.url) task?.downloadResults();
          // Note Cost
          if (message.data.cost) {
            const proj = Project.getProject();
            proj.costTracker?.addCost(
              message.data.id,
              message.data.provider,
              message.data.cost,
              { task_data: message.data }
            )
          }
        }
      };


      workerSocket.onerror = (err) => {
        console.error(
          "Worker websocket error",
          err
        );

        set({
          websocketStatus: "error",
        });
      };


      workerSocket.onclose = () => {
        console.log(
          "Worker websocket closed"
        );

        workerSocket = null;

        set({
          websocketStatus: "disconnected",
        });
      };
    },

    disconnectWorkerWebSocket: () => {
      if (workerSocket) {
        workerSocket.close();
        workerSocket = null;
      }

      set({
        websocketStatus: "disconnected",
      });
    },
  })
);


export function ConnectWorkerButton() {
  const user = useGoogleStore((s) => s.user);
  const status = useGoogleStore((s) => s.websocketStatus);

  const connect = useGoogleStore(
    (s) => s.connectWorkerWebSocket
  );

  const disconnect = useGoogleStore(
    (s) => s.disconnectWorkerWebSocket
  );

  const connected =
    status === "connected" || status === "connecting";

  return (
    <Button
      onClick={() => {
        if (!user) return;

        if (connected) {
          disconnect();
        } else {
          connect(user.email);
        }
      }}
      variant={
        connected
          ? "outline-success"
          : "outline-secondary"
      }
      disabled={!user}
      title={
        !user
          ? "Login to connect worker"
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
      }}
    >
      <FontAwesomeIcon
        icon={connected ? faLink : faLinkSlash}
      />
    </Button>
  );
}


export function UserCircle() {
  const user = useGoogleStore((s) => s.user);
  const login = useGoogleStore((s) => s.login);
  const logout = useGoogleStore((s) => s.logout);

  const [showLogin, setShowLogin] = useState(false);

  const expiresAt = useGoogleStore((s) => s.idTokenExpiresAt);
  const [refreshKey, setRefreshKey] = useState(0);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  // Hidden GoogleLogin mounted immediately
  const hiddenGoogleLogin = (!user || needsRefresh) && (
    <div style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}>
      <GoogleLogin
        key={refreshKey}
        useOneTap
        auto_select
        onSuccess={(credentialResponse) => {
          if (credentialResponse.credential) {
            login(credentialResponse.credential);
          }
          setNeedsRefresh(false);
        }}
        onError={() => console.log("Login Failed")}
      />
    </div>
  );

  useEffect(() => {
    if (!user || !expiresAt) return;
    const FIVE_MINUTES = 45 * 60 * 1000;

    const interval = setInterval(() => {
      console.log("5-minute timer triggered: Refreshing Google Token...");
      setRefreshKey((k) => k + 1);
      setNeedsRefresh(true);
    }, FIVE_MINUTES);

    return () => clearInterval(interval);
  }, [expiresAt, user]);


  if (!user || needsRefresh) {
    return (
      <>
        {hiddenGoogleLogin}

        <OverlayTrigger
          trigger="click"
          placement="bottom"
          rootClose
          show={showLogin}
          onToggle={(next) => setShowLogin(next)}
          overlay={
            <Popover>
              <Popover.Body>
                <GoogleLogin
                  onSuccess={(credentialResponse) => {
                    if (credentialResponse.credential) {
                      login(credentialResponse.credential);
                      setShowLogin(false);
                    }
                  }}
                  onError={() => console.log("Login Failed")}
                />
              </Popover.Body>
            </Popover>
          }
        >
          <Button
            variant="light"
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              padding: 0,
            }}
          >
            <FontAwesomeIcon icon={faUser} />
          </Button>
        </OverlayTrigger>
      </>
    );
  }

  return (
    <OverlayTrigger
      trigger="click"
      placement="bottom"
      rootClose
      overlay={
        <Popover>
          <Popover.Body>
            <div className="text-center">
              <img
                src={user.picture}
                alt={user.name}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  marginBottom: 10,
                }}
              />

              <div>
                <strong>{user.name}</strong>
              </div>

              <GoogleLoginExpiryTimer />

              <div
                style={{
                  fontSize: 13,
                  color: "#666",
                  marginBottom: 10,
                }}
              >
                {user.email}
              </div>

              <Button
                variant="outline-danger"
                size="sm"
                onClick={logout}
              >
                Logout
              </Button>


              <Button
                variant="outline-warning"
                size="sm"
                onClick={() => {
                  console.log("Manual Refresh...");
                  setRefreshKey((k) => k + 1);
                  setNeedsRefresh(true);
                }}
              >
                Refresh
              </Button>




            </div>
          </Popover.Body>
        </Popover>
      }
    >
      <Button
        variant="light"
        style={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          padding: 0,
          overflow: "hidden",
        }}
      >
        <img
          src={user.picture}
          alt={user.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </Button>
    </OverlayTrigger>
  );
}

export function LoginCircles() {
  return <div
    style={{
      position: "fixed",
      top: 16,
      right: 16,
      zIndex: 9999,
      overflow: "visible",
    }}
  >
    <Stack direction="horizontal" gap={1}>
      <ConnectWorkerButton />
      <UserCircle />
    </Stack>
  </div>

}




function GoogleLoginExpiryTimer() {
  const expiresAt = useGoogleStore((s) => s.idTokenExpiresAt);
  const logout = useGoogleStore((s) => s.logout);

  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft("");
      return;
    }

    const update = () => {
      const diff = expiresAt - Date.now();

      if (diff <= 0) {
        setTimeLeft("Expired");
        logout();
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };

    update();

    const interval = window.setInterval(update, 1000);

    return () => window.clearInterval(interval);
  }, [expiresAt, logout]);

  if (!expiresAt) return null;

  return (
    <div
      style={{
        fontSize: 12,
        color: "#888",
        marginTop: 2,
        marginBottom: 8,
      }}
    >
      Login expires in {timeLeft}
    </div>
  );
}