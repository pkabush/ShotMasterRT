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

export class KlingAI {
  // Function to dynamically provide keys, similar to ChatGPT.getApiKey
  public static getKeysDict: (() => { accessKey: string; secretKey: string } | null) | null = null;

  public static videoModels = [
    "kling-v1",
    "kling-v1-5",
    "kling-v1-6",
    "kling-v2-master",
    "kling-v2-1",
    "kling-v2-1-master",
    "kling-v2-5-turbo",
    "kling-v2-6",
    //"kling-video-o1",
  ];

  public static options = {
    img2video: {
      duration: {
        five: "5",
        ten: "10",
      },
      mode: {
        std: "std",
        pro: "pro"
      },
      model: {
        v1: "kling-v1",
        v1_5: "kling-v1-5",
        v1_6: "kling-v1-6",
        v2_0m: "kling-v2-master",
        v2_1: "kling-v2-1",
        v2_1m: "kling-v2-1-master",
        v2_5: "kling-v2-5-turbo",
        v2_6: "kling-v2-6"
      }
    },
    motion_control: {
      mode: {
        std: "std",
        pro: "pro",
      },
      character_orientation: {
        image: "image",
        video: "video",
      },
      keep_original_sound: {
        yes: "yes",
        no: "no",
      },
    },
    omni_video: {
      model: {
        o1: "kling-video-o1",
      },
      mode: {
        std: "std",
        pro: "pro",
      },
      aspect_ratio: {
        landscape: "16:9",
        portrait: "9:16",
        square: "1:1",
      },
      duration: {
        three: "3",
        four: "4",
        five: "5",
        six: "6",
        seven: "7",
        eight: "8",
        nine: "9",
        ten: "10",
      },
      video: {
        refer_type: {
          base: "base",      // video editing
          feature: "feature" // reference only
        },
        keep_original_sound: {
          yes: "yes",
          no: "no",
        },
      },
      image: {
        type: {
          first_frame: "first_frame",
          end_frame: "end_frame",
        },
      },
    },
  } as const;


  public static async getToken(): Promise<string> {
    const keys_dict = this.getKeysDict?.();
    if (!keys_dict) throw new Error("No Kling API keys provided or getKeysDict not set");

    return await generateKlingToken(keys_dict.accessKey, keys_dict.secretKey);
  }

  private static async postToKling(targetUrl: string, payload: any) {
    const encodedTarget = encodeURIComponent(targetUrl);
    const locUrl = `http://localhost:4000/proxy/${encodedTarget}`;
    const token = await this.getToken();

    console.log(`Kling API request to ${targetUrl}:`, payload);

    const response = await fetch(locUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kling API request failed: ${errorText}`);
    }

    const data = await response.json();
    console.log(`Kling API response from ${targetUrl}:`, data);
    return data;
  }

  // ================= TXT2VIDEO =================
  public static async txt2video(prompt: string, model: string = "kling-v1") {
    const payload = { model_name: model, mode: "std", duration: "5", prompt, cfg_scale: 0.5 };
    const targetUrl = "https://api-singapore.klingai.com/v1/videos/text2video";

    const data = await this.postToKling(targetUrl, payload);
    return { id: data.data.task_id, workflow: "text2video" };
  }

  // ================= IMG2VIDEO =================
  public static async img2video(options: {
    image: string;
    prompt?: string;
    model?: string;
    duration?: "5" | "10";
    mode?: "std" | "pro";
    cfg_scale?: number;
    static_mask?: string;
    dynamic_masks?: Array<{ mask: string; trajectories: { x: number; y: number }[] }>;
    image_tail?: string;
    camera_control?: { type?: string; config?: { horizontal?: number; vertical?: number; pan?: number; tilt?: number; roll?: number; zoom?: number } };
    voice_list?: { voice_id: string }[];
    sound?: "on" | "off";
    negative_prompt?: string;
    callback_url?: string;
    external_task_id?: string;
  }) {
    const {
      image,
      prompt,
      model = KlingAI.options.img2video.model.v2_6,
      duration = KlingAI.options.img2video.duration,
      mode = KlingAI.options.img2video.mode.std,
      cfg_scale = 0.5,
      static_mask,
      dynamic_masks,
      image_tail,
      camera_control,
      voice_list,
      sound = "off",
      negative_prompt,
      callback_url,
      external_task_id,
    } = options;

    const payload: any = { model_name: model, image, prompt, duration, mode, cfg_scale, sound };
    if (static_mask) payload.static_mask = static_mask;
    if (dynamic_masks) payload.dynamic_masks = dynamic_masks;
    if (image_tail) payload.image_tail = image_tail;
    if (camera_control) payload.camera_control = camera_control;
    if (voice_list) payload.voice_list = voice_list;
    if (negative_prompt) payload.negative_prompt = negative_prompt;
    if (callback_url) payload.callback_url = callback_url;
    if (external_task_id) payload.external_task_id = external_task_id;

    const targetUrl = "https://api-singapore.klingai.com/v1/videos/image2video";
    const data = await this.postToKling(targetUrl, payload);

    return { id: data.data.task_id, workflow: "image2video" };
  }

  // ================= MOTION CONTROL =================
  public static async motionControl(options: {
    image: string; // base64 or URL
    video_url: string; // URL
    prompt?: string;
    mode?: "std" | "pro";
    character_orientation: "image" | "video";
    keep_original_sound?: "yes" | "no";
    callback_url?: string;
    external_task_id?: string;
  }) {
    const {
      image,
      video_url,
      prompt,
      mode = KlingAI.options.motion_control.mode.std,
      character_orientation,
      keep_original_sound = KlingAI.options.motion_control.keep_original_sound.yes,
      callback_url,
      external_task_id,
    } = options;

    const payload: any = {
      image_url: image,
      video_url,
      character_orientation,
      mode,
      keep_original_sound,
    };

    if (prompt) payload.prompt = prompt;
    if (callback_url) payload.callback_url = callback_url;
    if (external_task_id) payload.external_task_id = external_task_id;

    const targetUrl = "https://api-singapore.klingai.com/v1/videos/motion-control";
    const data = await this.postToKling(targetUrl, payload);

    return {
      id: data.data.task_id,
      workflow: "motion-control",
    };
  }

  // ================= GET STATUS =================
  public static async getStatus(task_id: string, workflow: string = "text2video") {
    const targetUrl = `https://api-singapore.klingai.com/v1/videos/${workflow}/${task_id}`;
    const encodedTarget = encodeURIComponent(targetUrl);
    const locUrl = `http://localhost:4000/proxy/${encodedTarget}`;
    const token = await this.getToken();

    console.log("KLING_AI Get Status sent");

    const response = await fetch(locUrl, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Task status request failed: ${errorText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      console.log("KLING check status:", data);
      return {
        status: data?.data?.task_status || "unknown",
        status_msg: data?.data?.task_status_msg || "",
        url: data?.data?.task_result?.videos?.[0]?.url || null,
      };
    }
  }

  // ================= OMNI VIDEO (O1) =================
  public static async omniVideo(options: {
    prompt: string;
    model?: "kling-video-o1";
    mode?: "std" | "pro";
    aspect_ratio?: "16:9" | "9:16" | "1:1";
    duration?: "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10";
    image_list?: Array<{
      image_url: string; // base64 or URL
      type?: "first_frame" | "end_frame";
    }>;
    element_list?: Array<{
      element_id: number;
    }>;
    video_list?: Array<{
      video_url: string;
      refer_type?: "base" | "feature";
      keep_original_sound?: "yes" | "no";
    }>;
    callback_url?: string;
    external_task_id?: string;
  }) {
    const {
      prompt,
      model = "kling-video-o1",
      mode = "pro",
      aspect_ratio,
      duration = "5",
      image_list,
      element_list,
      video_list,
      callback_url,
      external_task_id,
    } = options;

    if (!prompt) {
      throw new Error("OmniVideo requires a prompt");
    }

    const payload: any = {
      model_name: model,
      prompt,
      mode,
      duration,
    };

    // Required when NOT using first frame or video edit
    if (aspect_ratio) payload.aspect_ratio = aspect_ratio;

    if (image_list) payload.image_list = image_list;
    if (element_list) payload.element_list = element_list;
    if (video_list) payload.video_list = video_list;
    if (callback_url) payload.callback_url = callback_url;
    if (external_task_id) payload.external_task_id = external_task_id;

    const targetUrl = "https://api-singapore.klingai.com/v1/videos/omni-video";
    const data = await this.postToKling(targetUrl, payload);

    return {
      id: data.data.task_id,
      workflow: "omni-video",
    };
  }
}