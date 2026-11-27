import { observer } from "mobx-react-lite";
import type { LocalVideo } from "../../classes/fileSystem/LocalVideo";
import { Button } from "react-bootstrap";
import { MediaKitAI } from "../../classes/AiProviders/Mediakit";
import { EditableJsonOptionSelect } from "../EditableJsonTextField";




interface LocalVideoProps {
    localVideo: LocalVideo;
}

export const BytePlus_MediaKitVideo: React.FC<LocalVideoProps> = observer(({ localVideo }) => {


    return <>
        <Button size="sm" variant="outline-success" onClick={async () => {
            console.log("[ENCHANCE Video] local video", localVideo);
            const shot = localVideo.shot;
            if (!shot) return;


            const video_url = await localVideo.uploadToR2();
            console.log("[ENCHANCE Video] r2 url", video_url);

            const payload = {
                video_url,
                scene: localVideo.mediaJson?.getField("settings/mediakit/scene") ?? "short_series",
                resolution: localVideo.mediaJson?.getField("settings/mediakit/resolution") ?? "1080p",
                tool_version: localVideo.mediaJson?.getField("settings/mediakit/tool_version") ?? "standard",
                enhance_style: localVideo.mediaJson?.getField("settings/mediakit/style") ?? "clear",
            }

            console.log("[ENCHANCE] Payload", payload);

            const res = await MediaKitAI.enhanceVideo({ video_url: video_url });
            console.log("[ENCHANCE Video] res", res);

            if (!res) return;

            shot.tasksJson!.addTask(res.task_id, {
                provider: res.provider,
                geninfo: {

                }
            })

        }}>
            Enchance
        </Button>

        <EditableJsonOptionSelect
            field="settings/mediakit/tool_version"
            localJson={localVideo.mediaJson}
            default_val="standard"
            values={["standard", "pro"]}
        />

        <EditableJsonOptionSelect
            field="settings/mediakit/resolution"
            localJson={localVideo.mediaJson}
            default_val="1080p"
            values={["720p",
                "1080p",
                "2k",
                "1440p",
                "4k",
                "6k",
                "8k"]}
        />

        <EditableJsonOptionSelect
            field="settings/mediakit/scene"
            localJson={localVideo.mediaJson}
            default_val="short_series"
            label="scene"
            values={["aigc",
                "short_series",
                "ugc",
                "old_film"]}
        />

        <EditableJsonOptionSelect
            field="settings/mediakit/style"
            localJson={localVideo.mediaJson}
            default_val="clear"
            label="style"
            values={
                localVideo.mediaJson?.getField("settings/mediakit/tool_version") === "pro" ?
                    [
                        "natural",
                        "soft",
                        "balanced",
                        "clear",
                        "hd"
                    ] :
                    [
                        "balanced",
                        "clear"
                    ]
            }
        />


        <Button
            href="https://docs.byteplus.com/en/docs/byteplus-vod/ai-mediakit-video-quality-enhancement?lang=en"
            size="sm"
            variant="outline-secondary"
        >?</Button>






    </>
});