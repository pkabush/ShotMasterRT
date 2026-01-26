import React, { useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import LoadingButton from "./Atomic/LoadingButton";
import SimpleSelect from "./Atomic/SimpleSelect";
import { KlingAI } from "../classes/KlingAI";
import { LocalVideo } from "../classes/LocalVideo";
import MediaGalleryVideo from "./MediaGalleryVideo";

interface VideoEditWindowProps {
    localVideo: LocalVideo;
    initialText?: string;
    onVideoTaskCreated?: (result: any) => void;
    onClose?: () => void;
}

type OmniMode = typeof KlingAI.options.omni_video.mode[keyof typeof KlingAI.options.omni_video.mode];
type KeepOriginalSound = typeof KlingAI.options.omni_video.video.keep_original_sound[keyof typeof KlingAI.options.omni_video.video.keep_original_sound];

const VideoEditWindow: React.FC<VideoEditWindowProps> = ({
    localVideo,
    initialText = "",
    onVideoTaskCreated,
    onClose,
}) => {
    const [text, setText] = useState(initialText);
    const [generating, setGenerating] = useState(false);
    const [mode, setMode] = useState<OmniMode>(KlingAI.options.omni_video.mode.pro);
    const [keepSound, setKeepSound] = useState<KeepOriginalSound>(KlingAI.options.omni_video.video.keep_original_sound.yes);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const webUrl = await localVideo.getWebUrl();

            const result = await KlingAI.omniVideo({
                prompt: text,
                model: KlingAI.options.omni_video.model.o1,
                mode,
                video_list: [
                    {
                        video_url: webUrl,
                        refer_type: KlingAI.options.omni_video.video.refer_type.base,
                        keep_original_sound: keepSound,
                    },
                ],
            });

            onVideoTaskCreated?.(result);
        } catch (err) {
            console.error("GenerateVideoEdit failed:", err);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="border d-flex flex-column" style={{ height: "700px" }}>
            <Group orientation="horizontal" style={{ height: "100%" }}>
                {/* Left panel — video preview */}
                <Panel defaultSize={500} minSize={10}>
                    <div className="d-flex align-items-center justify-content-center h-100">
                        <MediaGalleryVideo
                            localVideo={localVideo}
                            fillParent
                        />
                    </div>
                </Panel>

                <Separator
                    style={{
                        cursor: "ew-resize",
                        backgroundColor: "#8f8f8fff",
                        width: "10px",
                    }}
                />

                {/* Right panel — controls */}
                <Panel minSize={10}>
                    <div className="d-flex flex-column h-100 p-3">
                        <div className="d-flex justify-content-end mb-2">
                            {onClose && (
                                <button type="button" onClick={onClose}>
                                    ✕
                                </button>
                            )}
                        </div>

                        <div className="flex-grow-1 d-flex flex-column">
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="[@Video] make the character smile"
                                style={{
                                    flexGrow: 1,
                                    resize: "none",
                                    padding: "8px",
                                    fontSize: "14px",
                                }}
                            />

                            <SimpleSelect
                                label="Mode:"
                                value={mode}
                                options={Object.values(KlingAI.options.omni_video.mode)}
                                onChange={(val: string) => setMode(val as OmniMode)}                                
                            />

                            <SimpleSelect
                                label="Keep Original Sound:"
                                value={keepSound}
                                options={Object.values(
                                    KlingAI.options.omni_video.video.keep_original_sound
                                )}
                                onChange={(val: string) =>
                                    setKeepSound(val as KeepOriginalSound)
                                }
                            />

                            <LoadingButton
                                onClick={handleGenerate}
                                label="Generate"
                                is_loading={generating}
                            />
                        </div>
                    </div>
                </Panel>
            </Group>
        </div>
    );
};

export default VideoEditWindow;
