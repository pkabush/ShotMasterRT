import { memo } from "react";
import {
    NodeResizeControl,
    type Node,
    type NodeProps,
    NodeToolbar,
    Position,
} from "@xyflow/react";
import { NamedInputHandle, NamedOutputHandle } from "../Atomic/NamedInput";
import SimpleSelect from "../../Atomic/SimpleSelect";
import { useNodeGraphApi } from "../nodeGraphApi";
import { nodeResizeControlStyle, NodeResizeIcon } from "./LocalImageNode";
import type { NodeDefinition } from "../NodeDefinition/NodeDefinition";

import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faAlignLeft,
    faPlus,
    faTrash,
} from "@fortawesome/free-solid-svg-icons";















export type MultiTextNodeData = {
    texts: string[];
    selected_text: number;
};

export type MultiTextNodeType = Node<
    MultiTextNodeData,
    "multiTextNode"
>;

export const MultiTextNode = memo(
    ({ id, data, selected }: NodeProps<MultiTextNodeType>) => {
        const nodegraph_api = useNodeGraphApi();

        const texts = data.texts ?? [];
        const selectedText = data.selected_text ?? 0;

        const text = texts[selectedText] ?? "";

        const getFirstLine = (value: string) => {
            const firstLine = value.split(/\r?\n/, 1)[0].trim();

            return firstLine || "(empty)";
        };

        const options = texts.map(
            (value, index) => `${index} : ${getFirstLine(value)}`
        );

        return (
            <>
                <NodeToolbar
                    isVisible={selected}
                    position={Position.Top}
                    align="start"
                >
                    <Button
                        size="sm"
                        variant="success"
                        onClick={() => {
                            const updatedTexts = [...texts, ""];

                            nodegraph_api.setNodeData(id, {
                                ...nodegraph_api.getNodeData(id),
                                texts: updatedTexts,
                                selected_text: updatedTexts.length - 1,
                            });
                        }}
                    >
                        <FontAwesomeIcon icon={faPlus} /> Add Text
                    </Button>

                    <Button
                        size="sm"
                        variant="danger"
                        disabled={
                            selectedText < 0 ||
                            selectedText >= texts.length
                        }
                        onClick={() => {
                            if (
                                selectedText < 0 ||
                                selectedText >= texts.length
                            ) {
                                return;
                            }

                            const updatedTexts = texts.filter(
                                (_, index) => index !== selectedText
                            );

                            nodegraph_api.setNodeData(id, {
                                ...nodegraph_api.getNodeData(id),
                                texts: updatedTexts,
                                selected_text: Math.min(
                                    selectedText,
                                    Math.max(updatedTexts.length - 1, 0)
                                ),
                            });
                        }}
                    >
                        <FontAwesomeIcon icon={faTrash} /> Delete Text
                    </Button>
                </NodeToolbar>

                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        boxSizing: "border-box",

                        display: "flex",
                        flexDirection: "column",

                        background: "#111",
                        color: "white",

                        border: selected
                            ? "2px solid #4da3ff"
                            : "1px solid #333",

                        borderRadius: 12,
                        padding: 12,

                        minWidth: 200,
                        minHeight: 100,

                        boxShadow: selected
                            ? "0 0 0 2px rgba(77,163,255,0.3)"
                            : "none",

                        transition: "all 0.15s ease",
                    }}
                >
                    <div
                        style={{
                            fontSize: 12,
                            marginBottom: 8,
                            opacity: 0.7,
                        }}
                    >
                        Multi Text Node
                    </div>

                    <SimpleSelect
                        label="Selected Text"
                        value={options[selectedText] ?? ""}
                        options={options}
                        onChange={(_, index) => {
                            nodegraph_api.setNodeData(id, {
                                ...nodegraph_api.getNodeData(id),
                                selected_text: index,
                            });
                        }}
                    />

                    <textarea
                        className="nodrag nopan nowheel"
                        value={text}
                        placeholder="Enter text..."
                        onChange={(e) => {
                            const value = e.target.value;

                            if (
                                selectedText < 0 ||
                                selectedText >= texts.length
                            ) {
                                return;
                            }

                            const updatedTexts = [...texts];
                            updatedTexts[selectedText] = value;

                            nodegraph_api.setNodeData(id, {
                                ...nodegraph_api.getNodeData(id),
                                texts: updatedTexts,
                            });
                        }}
                        style={{
                            flex: 1,
                            minHeight: 0,

                            width: "100%",
                            resize: "both",

                            marginTop: 12,
                            padding: 10,

                            boxSizing: "border-box",

                            background: "#1a1a1a",
                            color: "white",

                            border: "1px solid #333",
                            borderRadius: 8,

                            outline: "none",

                            overflowY: "auto",
                            overflowX: "hidden",

                            whiteSpace: "pre-wrap",
                            fontFamily: "monospace",
                            fontSize: 12,
                            lineHeight: 1.5,
                        }}
                    />

                    <NodeResizeControl
                        style={nodeResizeControlStyle}
                        minWidth={200}
                        minHeight={100}
                    >
                        <NodeResizeIcon />
                    </NodeResizeControl>

                    <NamedInputHandle id={`in`} />
                    <NamedOutputHandle id="selected_text" />
                    <NamedOutputHandle id="texts" index={1} />
                </div>
            </>
        );
    }
);

MultiTextNode.displayName = "MultiTextNode";

export const MultiTextNodeDefinition: NodeDefinition<
    MultiTextNodeData,
    "multiTextNode",
    any
> = {
    type: "multiTextNode",
    icon: faAlignLeft,
    displayName: "Multi Text Node",

    component: MultiTextNode,

    defaultData: {
        texts: [""],
        selected_text: 0,
    },

    getNodeOutputData: ({ node, outputId }) => {
        switch (outputId) {
            case "selected_text": {
                const selectedText = node.data.selected_text as number;
                const texts = node.data.texts as string[];

                return texts[selectedText] ?? "";
            }

            case "texts": {
                return [node.data.texts];
            }

            default:
                throw new Error(
                    `Unknown output "${outputId}" for Multi Text Node`
                );
        }
    },

    operations: {
        addText: ({ node, api, text }: any) => {
            const texts = [...node.data.texts, text];

            api.setNodeData(node.id, {
                ...node.data,
                texts,
                selected_text: texts.length - 1,
            });
        },
    },
};