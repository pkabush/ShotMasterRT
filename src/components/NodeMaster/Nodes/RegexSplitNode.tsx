import { memo } from "react";
import {
    NodeResizeControl,
    type Node,
    type NodeProps,
} from "@xyflow/react";
import {
    NamedInputHandle,
    NamedOutputHandle,
} from "../Atomic/NamedInput";
import type { NodeDefinition } from "../NodeDefinition/NodeDefinition";
import { faCode } from "@fortawesome/free-solid-svg-icons";
import { useNodeGraphApi } from "../nodeGraphApi";
import { nodeResizeControlStyle, NodeResizeIcon } from "./LocalImageNode";
import SimpleSelect from "../../Atomic/SimpleSelect";

export type RegexSplitNodeData = {
    regex: string;
    selected_piece: number;
};

export type RegexSplitNodeType = Node<
    RegexSplitNodeData,
    "regexSplitNode"
>;

type SplitData = unknown;
const splitTextRecursively = (
    data: SplitData,
    regex: string,
): SplitData => {
    if (typeof data === "string") {
        if (!regex) {
            return data ? [data] : [];
        }

        return splitWithDelimiter(data, regex);
    }

    if (Array.isArray(data)) {
        return data.map((item) => splitTextRecursively(item, regex));
    }

    return data;
};

const splitWithDelimiter = (
    text: string,
    regex: string,
): string[] | string[][] => {
    if (!regex) {
        return text ? [text] : [];
    }

    const re = new RegExp(regex, "g");
    const matches = [...text.matchAll(re)];

    if (matches.length === 0) {
        return [text];
    }

    const pieces: string[] = [];

    const firstIndex = matches[0].index ?? 0;

    if (firstIndex > 0) {
        pieces.push(text.slice(0, firstIndex));
    }

    for (let i = 0; i < matches.length; i++) {
        const start = matches[i].index ?? 0;
        const end =
            i + 1 < matches.length
                ? matches[i + 1].index ?? text.length
                : text.length;

        pieces.push(text.slice(start, end));
    }

    return [pieces];
};

const flattenStrings = (data: unknown): string[] => {
    if (typeof data === "string") {
        return [data];
    }

    if (Array.isArray(data)) {
        return data.flatMap(flattenStrings);
    }

    return [];
};

export const RegexSplitNode = memo(
    ({ id, data, selected }: NodeProps<RegexSplitNodeType>) => {
        const nodegraph_api = useNodeGraphApi();

        const inputData = nodegraph_api.in2Data(id, "input_0");
        const regex = data.regex ?? "";
        const selectedPiece = data.selected_piece ?? 0;

        let splitData: unknown;
        let pieces: string[] = [];
        let regexError = false;

        try {
            splitData = splitTextRecursively(inputData, regex);
            pieces = flattenStrings(splitData);
        } catch {
            regexError = true;
        }

        const safeSelectedPiece =
            pieces.length > 0
                ? Math.min(selectedPiece, pieces.length - 1)
                : 0;

        const selectedText = pieces[safeSelectedPiece] ?? "";

        const updateRegex = (value: string) => {
            nodegraph_api.setNodeData(id, {
                ...nodegraph_api.getNodeData(id),
                regex: value,
            });
        };

        const updateSelectedPiece = (value: string) => {
            nodegraph_api.setNodeData(id, {
                ...nodegraph_api.getNodeData(id),
                selected_piece: Number(value),
            });
        };

        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    boxSizing: "border-box",

                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                    minHeight: 0,

                    background: "#111",
                    color: "white",

                    border: selected
                        ? "2px solid #4da3ff"
                        : "1px solid #333",

                    borderRadius: 12,
                    padding: 12,

                    boxShadow: selected
                        ? "0 0 0 2px rgba(77,163,255,0.3)"
                        : "none",

                    transition: "all 0.15s ease",
                }}
            >
                <NodeResizeControl
                    style={nodeResizeControlStyle}
                    minWidth={200}
                    minHeight={100}
                >
                    <NodeResizeIcon />
                </NodeResizeControl>

                <div
                    style={{
                        fontSize: 12,
                        marginBottom: 8,
                        opacity: 0.7,
                    }}
                >
                    Regex Split Node
                </div>

                <div
                    style={{
                        fontSize: 11,
                        opacity: 0.6,
                        marginBottom: 4,
                    }}
                >
                    Split by regex
                </div>

                <input
                    className="nodrag nopan nowheel"
                    value={regex}
                    placeholder={"e.g. \\s+"}
                    style={{
                        width: "100%",
                        boxSizing: "border-box",
                        background: "#0c0c0c",
                        color: "white",
                        border: regexError
                            ? "1px solid #ff5555"
                            : "1px solid #444",
                        borderRadius: 6,
                        padding: 8,
                        outline: "none",
                        fontFamily: "monospace",
                        fontSize: 13,
                        marginBottom: 10,
                    }}
                    onChange={(e) => updateRegex(e.target.value)}
                />

                {regexError && (
                    <div
                        style={{
                            color: "#ff5555",
                            fontSize: 11,
                            marginBottom: 8,
                        }}
                    >
                        Invalid regular expression
                    </div>
                )}

                <SimpleSelect
                    label="Selected Piece"
                    value={String(safeSelectedPiece)}
                    options={pieces.map((piece, index) => {
                        const firstLine = piece.split(/\r?\n/)[0].trim();
                        const preview =
                            firstLine.length > 50
                                ? firstLine.slice(0, 50) + "..."
                                : firstLine;

                        return `${index}: ${preview || '""'}`;
                    })}
                    onChange={(val: string) => {
                        const index = Number(val.split(":")[0]);

                        updateSelectedPiece(String(index));
                    }}
                />

                <div
                    className="nodrag nopan nowheel"
                    style={{
                        flex: 1,
                        minHeight: 0,
                        minWidth: 0,

                        marginTop: 12,
                        padding: 10,

                        background: "#1a1a1a",
                        border: "1px solid #333",
                        borderRadius: 8,

                        overflowY: "auto",
                        overflowX: "hidden",

                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",

                        fontFamily: "monospace",
                        fontSize: 12,
                        lineHeight: 1.5,
                    }}
                >
                    {regexError ? (
                        "Invalid regular expression"
                    ) : pieces.length === 0 ? (
                        "No text available"
                    ) : (
                        selectedText || (
                            <span style={{ opacity: 0.3 }}>
                                ""
                            </span>
                        )
                    )}
                </div>

                <NamedInputHandle id="input_0" />
                <NamedOutputHandle id="out" index={1} />
                <NamedOutputHandle id="selected" />
            </div>
        );
    }
);

RegexSplitNode.displayName = "RegexSplitNode";

export const RegexSplitNodeDefinition: NodeDefinition<RegexSplitNodeData, "regexSplitNode", any> = {
    type: "regexSplitNode",
    icon: faCode,
    displayName: "Regex Split Node",

    component: RegexSplitNode,

    defaultData: {
        regex: "",
        selected_piece: 0,
    },

    getNodeOutputData: ({ node, outputId, api }) => {
        const id = node.id;
        const inputData = api.in2Data(id, "input_0");

        const regex = (node.data.regex as string) ?? "";
        const selectedPiece = Number(node.data.selected_piece ?? 0);

        let splitData: unknown;

        try {
            splitData = splitTextRecursively(inputData, regex);
        } catch {
            return "";
        }

        switch (outputId) {
            case "selected": {
                const pieces = flattenStrings(splitData);
                return pieces[selectedPiece] ?? "";
            }

            case "out":
                return splitData;

            default:
                throw new Error(
                    `Unknown output "${outputId}" for Regex Split Node`
                );
        }
    },
};


