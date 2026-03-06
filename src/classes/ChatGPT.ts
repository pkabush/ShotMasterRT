import OpenAI from "openai";


// Custom error types for clarity
export class MissingApiKeyError extends Error { }
export class InvalidApiKeyError extends Error { }

export const models = [
  "gpt-4o-mini",
  "gpt-5.1",
  "gpt-5-mini",
  "gpt-5-nano",
  "gpt-5",
]

export class ChatGPT {
  public static options = {
    models: {
      gpt_4o_mini: "gpt-4o-mini",
      //gpt_5_1: "gpt-5.1",
      gpt_5_mini: "gpt-5-mini",
      //gpt_5_nano: "gpt-5-nano",
      gpt_5: "gpt-5",
      gpt_5_4: "gpt-5.4",
    }
  }


  // Functions to get/set API key dynamically
  public static getApiKey: (() => string | null) | null = null;
  public static setApiKey: ((key: string) => void) | null = null;

  private static getClient() {
    const key = this.getApiKey?.() || "";
    if (!key) throw new MissingApiKeyError("No OpenAI API key set");
    return new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
  }

  public static async txt2txt(
    input?: string,
    system_msg?: string,
    model: string = "gpt-4o-mini",  // default value    
    images?: { handle: File }[]
  ) {
    try {
      const client = this.getClient();

      const messages: any[] = [];

      // Add system message if provided
      if (system_msg) {
        messages.push({ role: "system", content: system_msg });
      }

      // Add user text message if provided
      if (input) {
        messages.push({
          role: "user",
          content: [{ type: "input_text", text: input }]
        });
      }

      if (images) console.log(images);
      // Add images as user messages
      /*
      if (images && images.length > 0) {
        for (const image of images) {
          const { dataUrl } = await fileToBase64(image.handle); // you'll need this helper
          messages.push({
            role: "user",
            content: [{ type: "image_url", image_url: { url: dataUrl } }]
          });
        }
      }
     */

      const payload = {
        model: model,
        input: messages,
        tools: [{type: "image_generation" as const, action: "edit" as const}],
      }

      console.log("GPT Payload:", payload)
      const response = await client.responses.create(payload);

      const text = response.output_text;
      console.log("GPT Response TEXT:", { "text": text });
      return text;

    } catch (err: any) {
      console.error("ChatGPT Error:", err);

      const message = err?.message || "";
      if (message.includes("Incorrect API key provided") || err instanceof MissingApiKeyError) {
        const userKey = window.prompt("Your OpenAI API key is missing or invalid. Please enter a valid key:");
        if (userKey) {
          this.setApiKey?.(userKey);
        } else {
          console.warn("User did not provide a valid API key.");
        }
        return null;
      }

      throw err;
    }
  }


  // ---------- img2img function ----------
  public static async img2img(
    prompt: string,
    model: string = ChatGPT.options.models.gpt_5,
    images?: { rawBase64: string; mime: string; description: string }[]
  ) {
    try {
      const openai = this.getClient();

      const content: any[] = [
        { type: "input_text", text: prompt }
      ];

      // Add images
      if (images?.length) {
        for (const img of images) {
          if (!img?.rawBase64 || !img?.mime) continue;

          if (img.description) {
            content.push({
              type: "input_text",
              text: img.description,
            });
          }

          content.push({
            type: "input_image",
            image_url: `data:${img.mime};base64,${img.rawBase64}`,
          });
        }
      }

      const payload = {
        model,
        input: [
          {
            role: "user" as const,
            content,
          },
        ],
        tools: [{ type: "image_generation" as const }],
      };

      console.log("OpenAI Payload", payload);

      const response = await openai.responses.create(payload);
      console.log("OPENAI RES", response);

      const imageData = response.output
        ?.filter((o: any) => o.type === "image_generation_call")
        ?.map((o: any) => o.result);

      if (imageData?.length) {
        const base64 = imageData[0];

        return {
          base64Obj: {
            rawBase64: base64,
            mime: "image/png",
          },
          id: response.id,
        };
      }

      return null;

    } catch (err: any) {
      const message = err?.message || "";

      if (
        message.includes("API key") ||
        message.includes("invalid_api_key") ||
        err instanceof MissingApiKeyError
      ) {
        console.log( "INPUT GPT KEY!");
        //this.showKeyPromptWindow();
        return null;
      }

      console.error("img2img error", err);
      throw err;
    }
  }

}
