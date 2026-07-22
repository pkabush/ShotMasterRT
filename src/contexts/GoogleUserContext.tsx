import React from "react";
import { create } from "zustand";
import { jwtDecode } from "jwt-decode";
import {
  GoogleLogin,
  useGoogleLogin,
} from "@react-oauth/google";


interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
}


interface GoogleStore {
  user: GoogleUser | null;
  driveAccessToken: string | null;

  login: (credential: string) => void;
  logout: () => void;

  setDriveAccessToken: (token: string) => void;

  requestDriveAccessToken: (() => Promise<string>) | null;
  setRequestDriveAccessToken: (
    fn: () => Promise<string>
  ) => void;

  uploadFileToShotmasterStore: (
    file: File
  ) => Promise<string>;
}


export const useGoogleStore = create<GoogleStore>(
  (set, get) => ({
    user: null,
    driveAccessToken: null,

    login: (credential: string) => {
      const decoded = jwtDecode<any>(credential);
      set({
        user: {
          id: decoded.sub,
          name: decoded.name,
          email: decoded.email,
          picture: decoded.picture,
        },
      });
    },
    logout: () => {
      set({
        user: null,
        driveAccessToken: null,
      });
    },
    setDriveAccessToken: (token: string) => {
      set({
        driveAccessToken: token,
      });
    },
    uploadFileToShotmasterStore: async (file) => {
      let token = get().driveAccessToken;
      if (!token) {
        const requestToken = get().requestDriveAccessToken;

        if (!requestToken) {
          throw new Error(
            "Google Drive login callback not registered"
          );
        }

        token = await requestToken();
      }

      return uploadFileToShotmasterStore(token, file);
    },
    requestDriveAccessToken: null,
    setRequestDriveAccessToken: (fn) =>
      set({
        requestDriveAccessToken: fn,
      }),

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


export function GDriveLoginButton() {
  const setDriveAccessToken = useGoogleStore((s) => s.setDriveAccessToken);
  const setRequestDriveAccessToken = useGoogleStore((s) => s.setRequestDriveAccessToken);

  const resolver = React.useRef<((token: string) => void) | null>(null);
  const rejecter = React.useRef<((err: Error) => void) | null>(null);

  const login = useGoogleLogin({
    scope: "openid profile email https://www.googleapis.com/auth/drive",

    onSuccess: ({ access_token }) => {
      setDriveAccessToken(access_token);
      resolver.current?.(access_token);
      resolver.current = null;
      rejecter.current = null;
    },

    onError: () => {
      rejecter.current?.(new Error("Google login failed"));
      resolver.current = null;
      rejecter.current = null;
    },
  });

  React.useEffect(() => {
    setRequestDriveAccessToken(
      () =>
        new Promise<string>((resolve, reject) => {
          resolver.current = resolve;
          rejecter.current = reject;
          login();
        })
    );
  }, [login]);

  return <></>;
  /*
  return (
    <button onClick={() => login()}>
      Sign in with Google Drive
    </button>
  );
  */
}

/*
async function listFilesInFolder(
  accessToken: string,
  folderId: string
) {

  const query =
    `'${folderId}' in parents`;


  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?` +
    new URLSearchParams({
      q: query,
      fields: "files(id,name,mimeType)",
      pageSize: "100",
    }),
    {
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
    }
  );


  if (!response.ok) {
    throw new Error(
      "Failed to fetch folder files"
    );
  }


  const data =
    await response.json();


  return data.files;
}
  */
async function findFolderByName(
  accessToken: string,
  folderName: string
) {

  const query =
    `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`;


  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?` +
    new URLSearchParams({
      q: query,
      fields: "files(id,name)",
    }),
    {
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
    }
  );


  if (!response.ok) {
    throw new Error(
      "Failed to search folder"
    );
  }


  const data =
    await response.json();


  return data.files;
}
export function downloadLink(
  fileId: string
) {

  return (
    `https://drive.google.com/uc?export=download&id=${fileId}`
  );

}
async function findFileInFolder(
  accessToken: string,
  folderId: string,
  fileName: string,
) {
  const query =
    `'${folderId}' in parents and name='${fileName.replace(/'/g, "\\'")}' and trashed=false`;

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?` +
    new URLSearchParams({
      q: query,
      fields: "files(id,name)",
      pageSize: "1",
    }),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to search for existing file");
  }

  const data = await response.json();
  return data.files[0] ?? null;
}
export async function uploadFileToShotmasterStore(
  accessToken: string,
  file: File,
): Promise<string> {

  let folders = await findFolderByName(accessToken, "ShotmasterStore");
  let folderId: string;

  if (!folders.length) {
    const createdFolder = await createFolder(accessToken, "ShotmasterStore");
    folderId = createdFolder.id;
  } else {
    folderId = folders[0].id;
  }

  // If the file already exists, reuse it.
  const existingFile = await findFileInFolder(accessToken, folderId, file.name);
  if (existingFile) { return downloadLink(existingFile.id); }

  const metadata = {
    name: file.name,
    parents: [folderId],
  };


  const form =
    new FormData();


  form.append(
    "metadata",
    new Blob(
      [
        JSON.stringify(metadata)
      ],
      {
        type: "application/json",
      }
    )
  );


  form.append(
    "file",
    file
  );



  const uploadResponse =
    await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
        body: form,
      }
    );



  if (!uploadResponse.ok) {

    throw new Error(
      `Upload failed: ${await uploadResponse.text()}`
    );

  }



  const uploadedFile =
    await uploadResponse.json();


  const fileId =
    uploadedFile.id;




  const permissionResponse =
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          role: "reader",
          type: "anyone",
        }),

      }
    );



  if (!permissionResponse.ok) {

    throw new Error(
      `Permission update failed: ${await permissionResponse.text()}`
    );

  }

  return downloadLink(fileId);
}
async function createFolder(
  accessToken: string,
  folderName: string
) {
  const response = await fetch(
    "https://www.googleapis.com/drive/v3/files",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to create folder: ${await response.text()}`
    );
  }

  return response.json();
}