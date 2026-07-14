import { memo, useState } from "react";
import { type Node, type NodeProps } from "@xyflow/react";
import { Button, Stack } from "react-bootstrap";
import SimpleSelect from "../../Atomic/SimpleSelect";
import { GoogleAI } from "../../../classes/GoogleAI";
import LoadingSpinner from "../../Atomic/LoadingSpinner";
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
        const { local_file } = useLocalFile();
        const [loading, setLoading] = useState(false);

        const incomingCount = nodegraph_api.useDynamicInputHandles(id);

        const handleClick = async () => {
            setLoading(true);
            try {
                const model = data.model;
                const resolution = data.resolution;
                const aspect_ratio = data.aspect_ratio;

                const msg_packs_messages = await nodegraph_api.gatherInputMessages(id);
                const msg_packs = nodegraph_api.iterateMessagePacks(msg_packs_messages);

                // Send All messages in parralel
                await Promise.all(
                    msg_packs.map(async (messages) => {
                        const res = await ChatGPT.sendMessages(messages, model, aspect_ratio, resolution, data.gen_image);
                        await nodegraph_api.saveAiTextImageResponse(id, res, local_file);
                        return res;
                    })
                );

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



