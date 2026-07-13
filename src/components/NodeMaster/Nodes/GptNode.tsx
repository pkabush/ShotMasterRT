import { memo, useState } from "react";
import {  useUpdateNodeInternals, type Node, type NodeProps } from "@xyflow/react";
import { Button, Stack } from "react-bootstrap";
import SimpleSelect from "../../Atomic/SimpleSelect";
import { GoogleAI, type AIMessage } from "../../../classes/GoogleAI";
import LoadingSpinner from "../../Atomic/LoadingSpinner";
import { Project } from "../../../classes/Project";
import { LocalImage } from "../../../classes/fileSystem/LocalImage";
import { NamedInputHandle, NamedOutputHandle } from "../Atomic/NamedInput";
import { useLocalFile } from "../Context/LocalFileContext";
import { useNodeGraphApi } from "../nodeGraphApi";
import { ChatGPT } from "../../../classes/ChatGPT";

export type GptNodeModelData = {
    model?: string;
    gen_image?: boolean;
    resolution?: string;
    aspect_ratio?: string;
};

export type GptNodeModelType = Node<GptNodeModelData, "gptNodeModel">;

export const GptNode = memo(
    ({ id, data, selected }: NodeProps<GptNodeModelType>) => {
        const nodegraph_api = useNodeGraphApi();
        const updateNodeInternals = useUpdateNodeInternals();

        const project = Project.getProject();
        const { local_file } = useLocalFile();

        const [loading, setLoading] = useState(false);

        const incomingCount = nodegraph_api.useDynamicInputHandles(id);

        const handleClick = async () => {
            setLoading(true);
            try {
                const inputNodes = nodegraph_api.getIndexedInputNodes(id);

                // Get messages
                let messages: AIMessage[] = [];
                for (const node of inputNodes) {                    
                    if (!node) return;

                    console.log(node);

                    if (node.type == "textNode" && node.data.text) {
                        messages.push(node.data.text as string);
                    }
                    if (node.type == "localImageNode" && node.data.path) {
                        const image = project.getByAbsPath(node.data.path as string);
                        if (image instanceof LocalImage) {
                            messages.push(await image.getAIImage());
                        }
                    }
                };

                //return;

                const node = nodegraph_api.id2Node(id);
                if (!node) return;

                const model = data.model;
                const resolution = data.resolution;
                const aspect_ratio = data.aspect_ratio;

                const res = await ChatGPT.sendMessages(messages, model, aspect_ratio, resolution, data.gen_image);


                // Create OUTPUT Nodes

                if (!(typeof res === "string")) {
                    const out_image_nodes = nodegraph_api.getOutputNodes(id, "out_image", "localImageNode");

                    if (out_image_nodes.length == 0) {
                        const saved_image = await GoogleAI.saveResultImage(res, local_file.parentFolder!);
                        console.log(saved_image)
                        console.log(local_file)
                        console.log(local_file.parentFolder!)
                        if (!saved_image) return;

                        // Create New Node
                        const my_pos = node?.position ?? { x: 0, y: 0 };
                        const width = node?.measured?.width ?? 400;
                        const new_id = nodegraph_api.addNode("localImageNode", { x: my_pos.x + width + 120, y: my_pos.y }, { path: saved_image.path })
                        nodegraph_api.connect(id, new_id, "out_image", "path");
                    }
                    else {
                        const res_node = out_image_nodes[0]
                        const res_image = local_file.getByAbsPath(res_node.data.path as string) ?? local_file;

                        const saved_image = await GoogleAI.saveResultImage(res, res_image.parentFolder!);

                        nodegraph_api.setNodeData(res_node.id, { path: saved_image?.path });
                        updateNodeInternals(res_node.id);
                    }
                }
                else {
                    console.log(res);

                    const out_text_nodes = nodegraph_api.getOutputNodes(id, "out_text", "textNode");
                    if (out_text_nodes.length == 0) {
                        // Create New Node
                        const my_pos = node?.position ?? { x: 0, y: 0 };
                        const width = node?.measured?.width ?? 400;
                        const new_id = nodegraph_api.addNode("textNode", { x: my_pos.x + width + 120, y: my_pos.y }, { text: res })
                        nodegraph_api.connect(id, new_id, "out_text", "input_0");
                    }
                    else {
                        const set_id = out_text_nodes[0].id;
                        nodegraph_api.setNodeData(set_id, { text: res });
                        updateNodeInternals(set_id);
                    }                    
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
                    GPT Node
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

                        <Stack direction="horizontal" gap={1}>
                            <>
                                <SimpleSelect
                                    value={data.model ?? Object.values(ChatGPT.options.models)[0]}
                                    options={[
                                        ...Object.values(ChatGPT.options.models)
                                    ]}
                                    onChange={(val: string) => {
                                        nodegraph_api.setNodeData(id,
                                            () => ({ model: val, })
                                        )
                                    }}
                                />
                            </>


                            {!(Object.values(ChatGPT.options.image_models).includes(data.model ?? "")) &&
                                <Button size="sm" variant="warning"
                                    onClick={() => {
                                        nodegraph_api.setNodeData(id,
                                            (d) => ({ gen_image: !d.gen_image, })
                                        )
                                    }}>
                                    {(data.gen_image ?? false) ? "Img" : "Text"}
                                </Button>}




                        </Stack>

                        {(Object.values(ChatGPT.options.image_models).includes(data.model ?? "")) ?
                            <>
                                <SimpleSelect
                                    label="Aspect"
                                    value={data.aspect_ratio ?? GoogleAI.options.aspect_ratios.none}
                                    options={[
                                        ...Object.values(GoogleAI.options.aspect_ratios)
                                    ]}
                                    onChange={(val: string) => {
                                        nodegraph_api.setNodeData(id,
                                            () => ({ aspect_ratio: val, })
                                        )
                                    }}
                                />

                                <SimpleSelect
                                    label="Resolution"
                                    value={data.resolution ?? GoogleAI.options.resolution.none}
                                    options={[
                                        ...Object.values(GoogleAI.options.resolution)
                                    ]}
                                    onChange={(val: string) => {
                                        nodegraph_api.setNodeData(id,
                                            () => ({ resolution: val, })
                                        )

                                    }}
                                />
                            </>
                            :
                            <>

                            </>
                        }

                        <Button size="sm" onClick={handleClick} className="nodrag" variant="success">
                            Generate
                        </Button>
                    </Stack>

                </div>

                {/* OUTPUT HANDLE */}
                <NamedOutputHandle id="out_text" />
                <NamedOutputHandle id="out_image" index={1} />
                {/* Multi INPUT HANDLE */}
                {Array.from({ length: incomingCount + 1 }).map((_, index) => (
                    <NamedInputHandle id={`input_${index}`} index={index} key={index} />
                ))}

            </div >
        );
    }
);

GptNode.displayName = "ButtonNode";



