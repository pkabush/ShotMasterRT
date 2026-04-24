import React, { useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import LoadingButton from "./Atomic/LoadingButton";
import SimpleSelect from "./Atomic/SimpleSelect";
import { KlingAI } from "../classes/KlingAI";
import { LocalVideo } from "../classes/fileSystem/LocalVideo";
import MediaGalleryVideo from "./MediaComponents/MediaGalleryVideo";
import TabsContainer from "./TabsContainer";
import MediaGalleryPreview from "./MediaComponents/MediaGallerPreview";
import BottomCenterLabel from "./Atomic/MediaElements/BottomCenterLabel";
import type { MediaFolder } from "../classes/MediaFolder";
import EditableJsonTextField, { EditableJsonToggleField } from "./EditableJsonTextField";
import type { LocalImage } from "../classes/fileSystem/LocalImage";
import RefImagesPreview from "./MediaComponents/RefImagesPreview";
import { Stack } from "react-bootstrap";
import { SeedanceAI } from "../classes/AiProviders/Byteplus";
import { TagsFolderContainer } from "./FolderTags/FolderTagsContainer";
import { Project } from "../classes/Project";
import type { LocalFolder } from "../classes/fileSystem/LocalFolder";
import { ai_providers } from "../classes/AI_provider";
import { WorkflowOptionSelect } from "./WorkflowOptionSelect";
import type { Shot } from "../classes/Shot";
import { LocalAudio } from "../classes/fileSystem/LocalAudio";

interface VideoEditWindowProps {
    localVideo: LocalVideo;
    onVideoTaskCreated?: (result: any) => void;
    onClose?: () => void;
    reference_images?: LocalImage[];
}

type OmniMode = typeof KlingAI.options.omni_video.mode[keyof typeof KlingAI.options.omni_video.mode];
type OmniModel = typeof KlingAI.options.omni_video.model[keyof typeof KlingAI.options.omni_video.model];
type KeepOriginalSound = typeof KlingAI.options.omni_video.video.keep_original_sound[keyof typeof KlingAI.options.omni_video.video.keep_original_sound];

const VideoEditWindow: React.FC<VideoEditWindowProps> = ({
    localVideo,
    onVideoTaskCreated,
    onClose,
    reference_images = [],
}) => {
    const project = Project.getProject();
    const seedance_edit_wf = "seedance_edit_video";

    const [generating, setGenerating] = useState(false);
    const [useReferences, setUseReferences] = useState(false);
    const [mode, setMode] = useState<OmniMode>(KlingAI.options.omni_video.mode.pro);
    const [model, setModel] = useState<OmniModel>(KlingAI.options.omni_video.model.o1);
    const [keepSound, setKeepSound] = useState<KeepOriginalSound>(KlingAI.options.omni_video.video.keep_original_sound.yes);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const webUrl = await localVideo.getWebUrl();
            const prompt = localVideo.mediaJson?.getField("video_edit_prompt");
            const image_list = [];

            if (useReferences) {
                for (const refImage of reference_images) {
                    image_list.push({
                        image_url: (await refImage.getBase64()).rawBase64,
                    });
                }
            }


            const result = await KlingAI.omniVideo({
                prompt: prompt,
                model: model,
                mode,
                video_list: [
                    {
                        video_url: webUrl,
                        refer_type: KlingAI.options.omni_video.video.refer_type.base,
                        keep_original_sound: keepSound,
                    },
                ],
                image_list: image_list.length ? image_list : undefined,
            });

            (result as any).geninfo = {
                workflow: "kling_VideoEditO1",
                prompt: prompt,
                model: model,
                source: localVideo.path,
                refs: useReferences ? reference_images.map(img => img.path) : undefined,
                kling: {
                    mode: mode,
                    keep_original_sound: keepSound,
                }
            }

            onVideoTaskCreated?.(result);
        } catch (err) {
            console.error("GenerateVideoEdit failed:", err);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="border d-flex flex-column position-relative" style={{ height: "700px" }}>
            {/** CLOSE BUTTON */}
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    style={{
                        position: "absolute",  // remove from normal flow
                        top: "8px",            // distance from top
                        right: "8px",          // distance from right
                        cursor: "pointer",
                        background: "transparent",
                        border: "none",
                        fontSize: "1.2rem"
                    }}
                >
                    ✕
                </button>
            )}



            <Group orientation="horizontal" style={{ height: "100%" }}>
                {/* Left panel — video preview */}
                <Panel defaultSize={500} minSize={10}>
                    <div className="d-flex align-items-center justify-content-center h-100">
                        <MediaGalleryVideo localVideo={localVideo} fillParent />
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
                    <div className="d-flex flex-column h-100 p-3" style={{ height: "100%" }}>
                        <TabsContainer
                            tabs={{
                                VideoEdit:
                                    <div className="flex-grow-1 d-flex flex-column">

                                        {/** REFS Toggle */}
                                        <label className="d-flex align-items-center gap-2 mb-2">
                                            <input
                                                type="checkbox"
                                                checked={useReferences}
                                                onChange={(e) => setUseReferences(e.target.checked)}
                                            />
                                            Use References
                                        </label>
                                        <RefImagesPreview images={reference_images} />



                                        <>
                                            <>Prompt : </>
                                            <EditableJsonTextField localJson={localVideo.mediaJson} field={"video_edit_prompt"} fitHeight />
                                        </>


                                        <SimpleSelect
                                            label="Model:"
                                            value={model}
                                            options={Object.values(KlingAI.options.omni_video.model)}
                                            onChange={(val: string) => setModel(val as OmniModel)}
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
                                    </div>,
                                Seedance_Edit:
                                    <div className="flex-grow-1 d-flex flex-column">

                                        <TagsFolderContainer tags={localVideo.references} folders={[
                                            Project.getProject(),
                                            Project.getProject().artbook as LocalFolder,
                                            (localVideo.parentFolder!.parentFolder! as Shot) as LocalFolder,
                                        ]} />
                                        <>
                                            <>Prompt : </>
                                            <EditableJsonTextField localJson={localVideo.mediaJson} field={"video_edit_prompt"} fitHeight />

                                        </>


                                        <Stack direction="horizontal">
                                            <EditableJsonToggleField localJson={localVideo.mediaJson} field={"seedance_edit/generate_audio"} default_val={false} label="Sound" />


                                            <WorkflowOptionSelect
                                                project={project}
                                                workflowName={seedance_edit_wf}
                                                optionName="resolution"
                                                label="resolution"
                                                values={Object.values(SeedanceAI.options.video.resolution)}
                                            />
                                            <WorkflowOptionSelect
                                                project={project}
                                                workflowName={seedance_edit_wf}
                                                optionName="duration"
                                                label="duration"
                                                values={Object.values(SeedanceAI.options.video.duration)}
                                                defaultValue={SeedanceAI.options.video.duration.default}
                                            />
                                            <WorkflowOptionSelect
                                                project={project}
                                                workflowName={seedance_edit_wf}
                                                optionName="aspect_ratio"
                                                label="Ratio:"
                                                values={Object.values(SeedanceAI.options.video.ration)}
                                                defaultValue={SeedanceAI.options.video.ration.adaptive}
                                            />


                                        </Stack>

                                        <LoadingButton
                                            onClick={async () => {
                                                // EDIT VIDEO SEEDANCER!
                                                const project = Project.getProject()
                                                const content = []

                                                const shot = localVideo.shot;
                                                if (!shot) return;

                                                // video
                                                const webUrl = await localVideo.getWebUrl();
                                                content.push(
                                                    SeedanceAI.videoMsg(webUrl)
                                                )

                                                // prompt
                                                const prompt = localVideo.mediaJson?.getField("video_edit_prompt")
                                                if (prompt) content.push(SeedanceAI.textMsg(prompt))

                                                // References
                                                const references = await localVideo.references?.GetAI_Images() ?? []
                                                for (const reference of references) {
                                                    content.push(
                                                        SeedanceAI.imgMsg(
                                                            `data:${reference.mime};base64,${reference.rawBase64}`,
                                                            "reference_image"
                                                        )
                                                    )
                                                }

                                                // Audio Refs
                                                const audio_refs = await localVideo.references?.getActiveType(LocalAudio) ?? []
                                                for (const audio_ref of audio_refs) {
                                                    const base64 = await audio_ref.getBase64();
                                                    content.push(
                                                        SeedanceAI.audioMsg(
                                                            `data:${base64.mime};base64,${base64.rawBase64}`,
                                                        )
                                                    )
                                                }

                                                // TODO Video
                                                const video_refs = await localVideo.references?.getActiveType(LocalVideo) ?? []
                                                for (const video_ref of video_refs) {
                                                    const webUrl = await video_ref.getWebUrl();
                                                    content.push(
                                                        SeedanceAI.videoMsg(webUrl)
                                                    )
                                                }



                                                //console.log(content);

                                                const result = await SeedanceAI.generateVideo({
                                                    content,
                                                    generate_audio: localVideo.mediaJson?.getField("seedance_edit/generate_audio") ?? false,
                                                    resolution: project.workflows[seedance_edit_wf]?.resolution,
                                                    duration: project.workflows[seedance_edit_wf]?.duration ? Number(project.workflows[seedance_edit_wf].duration) : undefined,
                                                    ratio: project.workflows[seedance_edit_wf]?.aspect_ratio ?? SeedanceAI.options.video.ration.adaptive
                                                });

                                                if (!result) return;
                                                const task = shot.addTask(result.id, {
                                                    provider: ai_providers.BD,
                                                })
                                                await new Promise(res => setTimeout(res, 100));
                                                task.check_status();

                                            }}
                                            label="Generate"
                                            is_loading={generating}
                                        />


                                    </div>,
                                GenerateInfo: <>
                                    {/* Source preview */}
                                    {localVideo.sourceImage && (
                                        <>
                                            <MediaGalleryPreview
                                                mediaItem={localVideo.sourceImage}
                                                height={150}
                                                onSelectMedia={() => {
                                                    const mf = localVideo.sourceImage?.parentFolder as MediaFolder;
                                                    mf.setSelectedMedia(localVideo.sourceImage);
                                                }}
                                            >
                                                <BottomCenterLabel label="SOURCE" />
                                            </MediaGalleryPreview>
                                        </>
                                    )}

                                    <div>
                                        <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
                                            {JSON.stringify(localVideo.mediaJson?.data.geninfo, null, 2)}
                                        </pre>
                                    </div>

                                </>,



                            }} />
                    </div>
                </Panel>
            </Group>
        </div>
    );
};

export default VideoEditWindow;
