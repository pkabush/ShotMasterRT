import { memo, useState } from "react";
import { type Node, type NodeProps } from "@xyflow/react";
import { Button, Stack } from "react-bootstrap";
import SimpleSelect from "../../Atomic/SimpleSelect";
import LoadingSpinner from "../../Atomic/LoadingSpinner";
import { Project } from "../../../classes/Project";
import { LocalImage } from "../../../classes/fileSystem/LocalImage";
import { NamedInputHandle } from "../Atomic/NamedInput";
import { useNodeGraphApi } from "../nodeGraphApi";
import { KlingAI } from "../../../classes/KlingAI";
import { Shot } from "../../../classes/Shot";
import { ai_providers } from "../../../classes/AI_provider";

export type KlingNodeModelData = {
    model?: string;
    mode?: string;
    duration?: string;
    sound?: string;
};

export type KlingNodeType = Node<KlingNodeModelData, "KlingModel">;

export const KlingNode = memo(
    ({ id, data, selected }: NodeProps<KlingNodeType>) => {

        const [loading, setLoading] = useState(false);

        const nodegraph_api = useNodeGraphApi();

        const handleClick = async () => {
            setLoading(true);
            try {
                let task_info: { id: string; workflow: string } | null = null;
                console.log(data);

                // Get Shot
                const in0 = nodegraph_api.getInputNodes(id, "shot")[0];
                const project = Project.getProject();
                const shot = project.getByAbsPath(in0?.data?.path as string);
                if (!(shot instanceof Shot)) { throw new Error("Missing required input: SHOT"); }

                // Get Prompt
                const prompt_node = nodegraph_api.getInputNodes(id, "prompt")[0]
                let prompt = ""
                if (prompt_node)
                    if (prompt_node.type! == "textNode") prompt = prompt_node.data.text as string ?? ""

                //Get Images
                const first_frame_node = nodegraph_api.getInputNodes(id, "first_frame")[0]
                const last_frame_node = nodegraph_api.getInputNodes(id, "last_frame")[0]
                const first_frame = project.getByAbsPath((first_frame_node?.data?.path as string) ?? "", LocalImage)
                const last_frame = project.getByAbsPath((last_frame_node?.data?.path as string) ?? "", LocalImage)

                if (!first_frame) { throw new Error("Missing required input: first_frame"); }

                const first_frame_raw = (await first_frame?.getBase64()).rawBase64;
                const last_frame_raw = (await last_frame?.getBase64())?.rawBase64;

                console.log({ first_frame_raw, last_frame_raw });

                if (data.model === KlingAI.options.omni_video.model.o1) {
                    const image_list = [];
                    if (first_frame) {
                        image_list.push({
                            image_url: first_frame_raw as string,
                            type: KlingAI.options.omni_video.image.type.first_frame,
                        });
                    }
                    if (last_frame) {
                        image_list.push({
                            image_url: last_frame_raw as string,
                            type: KlingAI.options.omni_video.image.type.end_frame,
                        });
                    }

                    const payload = {
                        prompt,
                        model: data.model,
                        mode: data.mode,
                        duration: data.duration,
                        aspect_ratio: "16:9", // required unless editing video                        
                        image_list: image_list.length ? image_list : undefined,
                    }

                    task_info = await KlingAI.omniVideo(payload);
                }
                else {
                    const payload = {
                        image: first_frame_raw,
                        image_tail: last_frame_raw,
                        prompt,
                        model: data.model,
                        mode: data.mode,
                        duration: data.duration,
                        sound: data.sound
                    }

                    //console.log(payload);
                    task_info = await KlingAI.img2video(payload);
                }


                // Create Task
                if (task_info) {
                    const task = shot.addTask(task_info.id, {
                        provider: ai_providers.KLING,
                        workflow: task_info.workflow,
                    });
                    // Check Status
                    await new Promise(res => setTimeout(res, 100));
                    task.check_status();
                }


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
                    Kling
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
                        {/** MODEL */}
                        <SimpleSelect
                            label="Model"
                            value={data.model ?? KlingAI.options.img2video.model.v3}
                            options={Object.values(KlingAI.options.img2video.model)}
                            onChange={(val: string) => {
                                nodegraph_api.setNodeData(id, {
                                    ...nodegraph_api.getNodeData(id),
                                    ...{ model: val }
                                });
                            }}
                        />

                        {/** Mode */}
                        <SimpleSelect
                            label="mode"
                            value={data.mode ?? KlingAI.options.img2video.mode.std}
                            options={Object.values(KlingAI.options.img2video.mode)}
                            onChange={(val: string) => {
                                nodegraph_api.setNodeData(id, {
                                    ...nodegraph_api.getNodeData(id),
                                    ...{ mode: val }
                                });
                            }}
                        />

                        {/** Duration */}
                        <SimpleSelect
                            label="duration"
                            value={data.duration ?? KlingAI.options.img2video.duration.five}
                            options={Object.values(KlingAI.options.img2video.duration)}
                            onChange={(val: string) => {
                                nodegraph_api.setNodeData(id, {
                                    ...nodegraph_api.getNodeData(id),
                                    ...{ duration: val }
                                });
                            }}
                        />

                        {/** Sound */}
                        <SimpleSelect
                            label="Sound:"
                            value={data.sound ?? KlingAI.options.img2video.sound.off}
                            options={Object.values(KlingAI.options.img2video.sound)}
                            onChange={(val: string) => {
                                nodegraph_api.setNodeData(id, {
                                    ...nodegraph_api.getNodeData(id),
                                    ...{ sound: val }
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

KlingNode.displayName = "KlingNode";



