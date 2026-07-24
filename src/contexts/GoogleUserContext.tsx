import { create } from "zustand";
import { jwtDecode } from "jwt-decode";
import {
  GoogleLogin,
} from "@react-oauth/google";


interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
}


interface GoogleStore {
  user: GoogleUser | null;
  idToken: string | null;
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

      set({ idToken: credential, user, });

      // connect after login
      get().connectWorkerWebSocket(user.id);
    },

    logout: () => {
      get().disconnectWorkerWebSocket();
      set({
        user: null,
        driveAccessToken: null,
        idToken: null,
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

        console.log(
          "Worker message:",
          message
        );

        // handle messages here
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

export function GoogleLoginButton() {
  const login = useGoogleStore((state) => state.login);
  return (
    <GoogleLogin
      onSuccess={(credentialResponse) => {
        console.log("CRED RESPONSE", credentialResponse);
        if (credentialResponse.credential) {
          login(credentialResponse.credential);
        }
      }}

      onError={() => {
        console.log("Login Failed");
      }}
    />
  );
}


export const WORKER_URL = "http://localhost:8787";
//export const WORKER_URL = "https://shotmasterworker.kabushpavel.workers.dev";

const WORKER_WS_URL =
  import.meta.env.DEV
    ? "ws://localhost:8787"
    : "wss://shotmasterworker.kabushpavel.workers.dev";


export function WorkerStatus() {

  const status = useGoogleStore(
    s => s.websocketStatus
  );


  return (
    <div>
      Worker websocket: {status}
    </div>
  );
}