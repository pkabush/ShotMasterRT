import { memo, useEffect, useState } from "react";
import { Handle, Position, useReactFlow, useStore, useUpdateNodeInternals, type Node, type NodeProps } from "@xyflow/react";
import { Button, Stack } from "react-bootstrap";
import SimpleSelect from "../../Atomic/SimpleSelect";
import { GoogleAI } from "../../../classes/GoogleAI";
import LoadingSpinner from "../../Atomic/LoadingSpinner";

export type nb_GoogleTextModelData = {
    model?: string;
};

export type nb_GoogleTextModelType = Node<nb_GoogleTextModelData, "googleTextModel">;

export const nb_GoogleAI = memo(
    ({ id, data, selected }: NodeProps<nb_GoogleTextModelType>) => {

        const { getEdges, getNodes, setNodes } = useReactFlow();
        const [loading, setLoading] = useState(false);

        const incomingCount = useStore(
            (state) =>
                state.edges.reduce((acc, e) => (e.target === id ? acc + 1 : acc), 0)
        );

        const updateNodeInternals = useUpdateNodeInternals();

        useEffect(() => {
            updateNodeInternals(id);
        }, [incomingCount, id, updateNodeInternals]);


        const handleClick = async () => {
            setLoading(true);
            try {
                const edges = getEdges();
                const nodes = getNodes();

                const incoming = edges.filter((e) => e.target === id).sort((a, b) => {
                    const aIndex = parseInt(a.targetHandle?.replace("input_", "") ?? "0");
                    const bIndex = parseInt(b.targetHandle?.replace("input_", "") ?? "0");
                    return aIndex - bIndex;
                });;
                const inputNodes = incoming.map((e) => nodes.find((n) => n.id === e.source));

                let prompt = "";
                inputNodes.forEach((node) => {
                    if (!node) return;
                    if (node.type == "textNode") {
                        prompt += node.data.text + "\n";
                    }
                });

                console.log(prompt);

                const model = data.model;
                //const res = await GoogleAI.img2img(prompt, model);
                //console.log(res);

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
                    minHeight: 240,
                    position: "relative",
                    boxShadow: loading
                        ? "0 0 12px 2px rgba(0, 255, 100, 0.7)"
                        : "none",
                }}
            >

                <div style={{ fontSize: 12, marginBottom: 8, opacity: 0.7 }}>
                    Google AI
                </div>

                <div style={{
                    position: "absolute",
                    top: 10,
                    right: 15,


                }}>
                    <LoadingSpinner isLoading={loading} />
                </div>


                {/* Multi INPUT HANDLE */}
                {Array.from({ length: incomingCount + 1 }).map((_, index) => (
                    <>
                        <Handle
                            key={index}
                            type="target"
                            position={Position.Left}
                            id={`input_${index}`}
                            style={{
                                background: "#fff",
                                width: 10,
                                height: 10,
                                left: -5,
                                top: 15 + index * 20,
                            }}
                        />

                        <div
                            style={{
                                position: "absolute",
                                left: -50,
                                top: 8 + index * 20,
                                fontSize: 11,
                                opacity: 0.7,
                                color: "#fff",
                                pointerEvents: "none",
                            }}
                        >
                            {`input_${index}`}
                        </div>
                    </>
                ))}



                <Stack>
                    <SimpleSelect
                        value={data.model ?? Object.values(GoogleAI.options.text_models)[0]}
                        options={Object.values(GoogleAI.options.text_models)}
                        onChange={(val: string) => {
                            setNodes((nds) =>
                                nds.map((n) =>
                                    n.id === id ? {
                                        ...n, data: {
                                            ...n.data,
                                            model: val,
                                        },
                                    }
                                        : n
                                )
                            );
                        }}
                    />

                    <Button size="sm" onClick={handleClick} className="nodrag">
                        Generate
                    </Button>

                </Stack>



                {/* OUTPUT HANDLE */}
                <Handle
                    type="source"
                    position={Position.Right}
                    style={{
                        background: "#fff",
                        width: 10,
                        height: 10,
                        right: -5,
                        top: 15,
                    }}
                />
            </div >
        );
    }
);

nb_GoogleAI.displayName = "ButtonNode";