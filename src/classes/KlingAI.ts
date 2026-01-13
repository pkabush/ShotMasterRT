export async function generateKlingToken(
  accessKey: string,
  secretKey: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const payload = {
    iss: accessKey,
    exp: now + 1800, // valid 30 min
    nbf: now - 5,    // valid 5 sec ago
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  );

  return `${data}.${base64url(signatureBuffer)}`;
}

function base64url(input: ArrayBuffer | string): string {
  let bytes: Uint8Array;
  if (typeof input === "string") {
    bytes = new TextEncoder().encode(input);
  } else {
    bytes = new Uint8Array(input);
  }

  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export const video_models = [
  "kling-v1-6",
  "kling-v2-master",
  "kling-v2-1-master",
  "kling-v2-5-turbo",
  "kling-v2-6",
  "kling-v1",
];

export class KlingAI {
  public static async txt2video(prompt: string, keys_dict: { accessKey: string, secretKey: string }) {
    //const url = "https://api-singapore.klingai.com/v1/videos/text2video";

    const target = encodeURIComponent("https://api-singapore.klingai.com/v1/videos/text2video");
    const loc_url = `http://localhost:4000/proxy/${target}`;

    const payload = {
      model_name: "kling-v1",
      mode: "pro",
      duration: "5",
      prompt,
      cfg_scale: 0.5,
    };

    const token = await generateKlingToken(keys_dict.accessKey, keys_dict.secretKey);
    console.log("Kling Generate Video payload", {payload});

    const response = await fetch(loc_url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Request failed: ${errorText}`);
    }

    const data = await response.json();
    console.log("Kling Generate Video response",{data});

    return data;
  }

  public static async getStatus(
    task_id: string,
    keys_dict: { accessKey: string; secretKey: string }
  ) {

    // 1️⃣ generate token
    const token = await generateKlingToken(keys_dict.accessKey, keys_dict.secretKey);

    // 2️⃣ build the Kling API URL for querying a task
    const targetUrl = `https://api-singapore.klingai.com/v1/videos/text2video/${task_id}`;
    const encodedTarget = encodeURIComponent(targetUrl);
    const locUrl = `http://localhost:4000/proxy/${encodedTarget}`;

    // 3️⃣ fetch
    const response = await fetch(locUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // 4️⃣ handle errors
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Task status request failed: ${errorText}`);
    }

    //console.log("Response",response)
    const contentType = response.headers.get("content-type") || "";


    // 5️⃣ return standardized dict
    if (contentType.includes("application/json")) {
      const data = await response.json();

      return {
        task_status: data?.data?.task_status || "unknown",
        task_status_msg: data?.data?.task_status_msg || "",
        video_url: data?.data?.task_result?.videos?.[0]?.url || null,
      };
    }
  }



}