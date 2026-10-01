import { create } from "zustand";
import { GoogleLogin, } from "@react-oauth/google";
import { Button, OverlayTrigger, Popover, Stack } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { getWorkerUser, loginToWorker } from "../classes/CloudflareWorker/WorkerUtils";
import { useDebugStore } from "./DebugStore";
import { ConnectWorkerButton, useWebSocketStore } from "./WebSocketStore";

const test_web = false

export const WORKER_URL =
  import.meta.env.DEV && !test_web
    ? "http://localhost:8787"
    : "https://shotmasterworker.kabushpavel.workers.dev";

interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
  sub: string;
}

interface UserStore {
  user: GoogleUser | null;
  login: (credential: string) => void;
  logout: () => void;
  restoreSession: () => Promise<void>;
}

export const useUserStore = create<UserStore>(
  (set,) => ({
    user: null,

    login: async (credential: string) => {
      try {
        const response = await loginToWorker(credential);
        set({ user: response.user, });
        useWebSocketStore.getState().connect();
      } catch (error) {
        console.error("Google login failed:", error);
        throw error;
      }
    },
    logout: () => {
      useWebSocketStore.getState().disconnect();
      set({ user: null, });
    },
    restoreSession: async () => {
      try {
        const user = await getWorkerUser();
        if (!user) { return; }
        set({ user });
        useWebSocketStore.getState().connect();
      } catch (error) {
        console.error("Failed to restore session:", error);
      }
    },
  })
);



export function UserCircle() {
  const user = useUserStore((s) => s.user);
  const login = useUserStore((s) => s.login);
  const logout = useUserStore((s) => s.logout);
  const [showLogin, setShowLogin] = useState(false);


  const debugLog = useDebugStore((s) => s.debug_log);
  const setDebugLog = useDebugStore((s) => s.setDebugLog);

  if (!user) {
    return (
      <>
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

              <div
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: "1px solid #ddd",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontSize: 13,
                }}
              >
                <input
                  id="debug-log-toggle"
                  type="checkbox"
                  checked={debugLog}
                  onChange={(e) => setDebugLog(e.target.checked)}
                />

                <label
                  htmlFor="debug-log-toggle"
                  style={{
                    margin: 0,
                    cursor: "pointer",
                  }}
                >
                  Debug log
                </label>
              </div>


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



