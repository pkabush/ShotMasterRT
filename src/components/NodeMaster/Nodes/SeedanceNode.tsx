import { memo, useMemo, useState } from "react";
import { type Node, type NodeProps } from "@xyflow/react";
import { Button, Stack } from "react-bootstrap";
import SimpleSelect from "../../Atomic/SimpleSelect";
import LoadingSpinner from "../../Atomic/LoadingSpinner";
import { Project } from "../../../classes/Project";
import { LocalImage } from "../../../classes/fileSystem/LocalImage";
import { NamedInputHandle } from "../Atomic/NamedInput";
import { useNodeGraphApi } from "../nodeGraphApi";
import { Shot } from "../../../classes/Shot";
import { ai_providers } from "../../../classes/AI_provider";
import { LocalVideo } from "../../../classes/fileSystem/LocalVideo";
import { SeedanceAI } from "../../../classes/AiProviders/Byteplus";
import { LocalAudio } from "../../../classes/fileSystem/LocalAudio";
import { useLocalFile } from "../Context/LocalFileContext";
import { TasksJson } from "../../../classes/Task";
import type { LocalJson } from "../../../classes/LocalJson";

export type SeedanceNodeModelData = {
    resolution?: string;
    duration?: string;
    ratio?: string;
    sound?: boolean;
};

export type SeedanceNodeType = Node<SeedanceNodeModelData, "SeedanceModel">;

export const SeedanceNode = memo(
    ({ id, data, selected }: NodeProps<SeedanceNodeType>) => {

        const [loading, setLoading] = useState(false);

        const nodegraph_api = useNodeGraphApi();

        const { local_file } = useLocalFile();
        const localTasksJson = useMemo(() => { return new TasksJson(local_file as LocalJson); }, [local_file]);

        const handleClick = async () => {
            setLoading(true);
            try {
                // Get Shot
                const in0 = nodegraph_api.getInputNodes(id, "shot")[0];
                const project = Project.getProject();
                const shot = project.getByAbsPath(in0?.data?.path as string);
                //if (!(shot instanceof Shot)) { throw new Error("Missing required input: SHOT"); }
                const tasksJson = (shot instanceof Shot) ? shot.tasksJson : localTasksJson;

                // Get Prompt
                const prompt_node = nodegraph_api.getInputNodes(id, "prompt")[0]
                let prompt = ""
                if (prompt_node) if (prompt_node.type! == "textNode") prompt = prompt_node.data.text as string ?? ""


                //Get Images
                const first_frame_node = nodegraph_api.getInputNodes(id, "first_frame")[0]
                const last_frame_node = nodegraph_api.getInputNodes(id, "last_frame")[0]
                const first_frame = project.getByAbsPath((first_frame_node?.data?.path as string) ?? "", LocalImage)
                const last_frame = project.getByAbsPath((last_frame_node?.data?.path as string) ?? "", LocalImage)
                const first_frame_raw = (await first_frame?.getBase64());
                const last_frame_raw = (await last_frame?.getBase64());

                // GET MERGE INPUTS
                const references = [];
                const id_refs = nodegraph_api.getInputNodes(id, "refs")[0];
                if (id_refs) {
                    const merged_nodes = nodegraph_api.getInputNodes(id_refs.id);
                    for (const ref_node of merged_nodes) {
                        const reference_file = project.getByAbsPath((ref_node?.data?.path as string) ?? "")
                        if (reference_file) references.push(reference_file);
                    }
                }


                // Create Seedance Content
                const content = []
                if (prompt) content.push(SeedanceAI.textMsg(prompt))
                if (first_frame_raw) content.push(
                    SeedanceAI.imgMsg(
                        `data:${first_frame_raw.mime};base64,${first_frame_raw.rawBase64}`,
                        'first_frame'
                    )
                )
                if (last_frame_raw) content.push(
                    SeedanceAI.imgMsg(
                        `data:${last_frame_raw.mime};base64,${last_frame_raw.rawBase64}`,
                        "last_frame"
                    )
                )

                // Gather Refereces
                for (const reference of references) {
                    // Image Refs
                    if (reference instanceof LocalImage) {
                        const base64 = await reference.getBase64();
                        content.push(
                            SeedanceAI.imgMsg(
                                `data:${base64.mime};base64,${base64.rawBase64}`,
                                "reference_image"
                            )
                        )
                    }
                    // Video Refs
                    if (reference instanceof LocalVideo) {
                        const webUrl = await reference.getWebUrl();
                        content.push(SeedanceAI.videoMsg(webUrl));
                    }
                    // Audio Refs
                    if (reference instanceof LocalAudio) {
                        const base64 = await reference.getBase64();
                        SeedanceAI.audioMsg(
                            `data:${base64.mime};base64,${base64.rawBase64}`,
                        );
                    }
                }

                // Generate Video
                const result = await SeedanceAI.generateVideo({
                    content,
                    generate_audio: data.sound ?? false,
                    resolution: data.resolution,
                    duration: data.duration ? Number(data.duration) : undefined,
                    ratio: data.ratio ?? SeedanceAI.options.video.ration.adaptive
                });


                if (!result) return;
                const task = tasksJson!.addTask(result.id, { provider: ai_providers.BD, })
                await new Promise(res => setTimeout(res, 100));
                task.check_status();

            } finally {
                setLoading(false);
            }
        };


        return (
            <div
                style={{
                    background: "#111",
                    color: "white",
                    border: selected ? "2px solid #4da3ff" : "1px solid #333",
                    borderRadius: 12,
                    padding: 12,
                    minWidth: 240,
                    position: "relative",
                    boxShadow: loading
                        ? "0 0 12px 2px rgba(0, 255, 100, 0.7)"
                        : "none",
                }}
            >

                <div style={{ fontSize: 12, marginBottom: 8, opacity: 0.7 }}>
                    Seedance
                </div>

                <div className="nodrag">
                    <div style={{
                        position: "absolute",
                        top: 10,
                        right: 15,
                    }}>
                        <LoadingSpinner isLoading={loading} />
                    </div>

                    <Stack>
                        {/** Resolution */}
                        <SimpleSelect
                            label="resolution"
                            value={data.resolution ?? SeedanceAI.options.video.resolution.default}
                            options={Object.values(SeedanceAI.options.video.resolution)}
                            onChange={(val: string) => {
                                nodegraph_api.setNodeData(id, {
                                    ...nodegraph_api.getNodeData(id),
                                    ...{ resolution: val }
                                });
                            }}
                        />

                        <SimpleSelect
                            label="duration"
                            value={data.duration ?? SeedanceAI.options.video.duration.default}
                            options={Object.values(SeedanceAI.options.video.duration)}
                            onChange={(val: string) => {
                                nodegraph_api.setNodeData(id, {
                                    ...nodegraph_api.getNodeData(id),
                                    ...{ duration: val }
                                });
                            }}
                        />

                        <SimpleSelect
                            label="ratio"
                            value={data.ratio ?? SeedanceAI.options.video.ration.adaptive}
                            options={Object.values(SeedanceAI.options.video.ration)}
                            onChange={(val: string) => {
                                nodegraph_api.setNodeData(id, {
                                    ...nodegraph_api.getNodeData(id),
                                    ...{ ratio: val }
                                });
                            }}
                        />

                        <SimpleSelect
                            label="sound"
                            value={data.sound ? "on" : "off"}
                            options={["on", "off"]}
                            onChange={(val: string) => {
                                nodegraph_api.setNodeData(id, {
                                    ...nodegraph_api.getNodeData(id),
                                    ...{ sound: val == "on" }
                                });
                            }}
                        />




                    </Stack>


                    <Button size="sm" onClick={handleClick} className="nodrag" variant="success">
                        Generate
                    </Button>

                    <NamedInputHandle id={"shot"} index={0} />
                    <NamedInputHandle id={"prompt"} index={1} />
                    <NamedInputHandle id={"first_frame"} index={2} />
                    <NamedInputHandle id={"last_frame"} index={3} />
                    <NamedInputHandle id={"refs"} index={4} />

                </div >
            </div >
        );
    }
);

SeedanceNode.displayName = "SeedanceNode";



