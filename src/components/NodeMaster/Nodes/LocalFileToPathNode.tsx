import { memo, useState } from "react";
import { type Node, type NodeProps, } from "@xyflow/react";
import { NamedInputHandle, NamedOutputHandle } from "../Atomic/NamedInput";
import { Button } from "react-bootstrap";
import { useNodeGraphApi } from "../nodeGraphApi";
import type { NodeDefinition } from "../NodeDefinition/NodeDefinition";
import { faLeftRight } from "@fortawesome/free-solid-svg-icons";

export type LocalFileToPathNodeData = {
};

export type LocalFileToPathNodeType = Node<LocalFileToPathNodeData, "localFileToPathNode">;


export const LocalFileToPathNode = memo(
    ({ id, selected }: NodeProps<LocalFileToPathNodeType>) => {

        const nodegraph_api = useNodeGraphApi();

        const [paths, setPaths] = useState("No Paths");

        const refreshPaths = () => {
            const data = nodegraph_api.in2Data(id, "in");

            const files = Array.isArray(data)
                ? data.flat(Infinity)
                : data
                    ? [data]
                    : [];

            const newPaths = files
                .map((file: any) => file?.path)
                .filter(Boolean)
                .join("\n");

            setPaths(newPaths || "No paths");
        };


        return (
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
                    LocalFile to Path
                </div>

                <Button
                    size="sm"
                    variant="warning"
                    onClick={refreshPaths}
                >
                    Refresh Paths
                </Button>

                <div
                    className="nodrag nopan nowheel"
                    style={{
                        flex: 1,
                        minHeight: 0,

                        marginTop: 12,
                        padding: 10,

                        background: "#1a1a1a",
                        border: "1px solid #333",
                        borderRadius: 8,

                        overflowY: "auto",
                        overflowX: "hidden",

                        whiteSpace: "pre-wrap",
                        fontFamily: "monospace",
                        fontSize: 12,
                        lineHeight: 1.5,
                    }}
                >
                    {paths || "No paths text available"}
                </div>


                <NamedInputHandle id="in" />
                <NamedOutputHandle id="out" />

            </div >
        );
    }
);

LocalFileToPathNode.displayName = "LocalFileToPath";

export const LocalFileToPathNodeDefinition: NodeDefinition<LocalFileToPathNodeData, "localFileToPathNode", any> = {
    type: "localFileToPathNode",
    icon: faLeftRight,
    displayName: "LocalFile to Path",

    component: LocalFileToPathNode,

    defaultData: {
    },

    getNodeOutputData: ({ node, outputId, api }) => {
        const data = api.in2Data(node.id, "in");

        const files = Array.isArray(data)
            ? data.flat(Infinity)
            : data
                ? [data]
                : [];

        const newPaths = files
            .map((file: any) => file?.path)
            .filter(Boolean)
            .join("\n");

        return newPaths;

        console.log("GET", node, outputId);
        return null
    },
};
