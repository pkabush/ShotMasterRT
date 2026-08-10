import { memo } from "react";
import {
    NodeResizeControl,
    type Node,
    type NodeProps,
} from "@xyflow/react";
import { NamedOutputHandle } from "../Atomic/NamedInput";
import { Project } from "../../../classes/Project";
import SimpleSelect from "../../Atomic/SimpleSelect";
import { useNodeGraphApi } from "../nodeGraphApi";
import { nodeResizeControlStyle, NodeResizeIcon } from "./LocalImageNode";
import type { NodeDefinition } from "../NodeDefinition/NodeDefinition";
import { faSubscript } from "@fortawesome/free-solid-svg-icons";

export type ScriptNodeData = {
    selected_scene: string;
};

export type ScriptNodeType = Node<ScriptNodeData, "scriptNode">;


export const ScriptNode = memo(
    ({ id, data, selected }: NodeProps<ScriptNodeType>) => {

        const project = Project.getProject()
        const nodegraph_api = useNodeGraphApi();

        const selectedScene = data.selected_scene ?? "none";
        const scriptText =
            selectedScene === "FULL SCRIPT"
                ? project.script?.text ?? ""
                : project.script?.scenes.get(selectedScene) ?? "";

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
                    Script Node
                </div>

                <SimpleSelect
                    label="Selected Scene"
                    value={selectedScene}
                    options={["FULL SCRIPT", ...(project.script?.sortedSceneKeys ?? [])]}
                    onChange={(val: string) => {
                        nodegraph_api.setNodeData(id, {
                            ...nodegraph_api.getNodeData(id),
                            selected_scene: val
                        });
                    }}
                />

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
                    {scriptText || "No script text available"}
                </div>

                <NodeResizeControl style={nodeResizeControlStyle} minWidth={200} minHeight={100} >
                    <NodeResizeIcon />
                </NodeResizeControl>

                <NamedOutputHandle id="full_script" />
                <NamedOutputHandle id="selected_scene" index={1} />

            </div>
        );
    }
);

ScriptNode.displayName = "ScriptNode";



export const ScriptNodeDefinition: NodeDefinition<ScriptNodeData, "scriptNode", string> = {
    type: "scriptNode",
    icon: faSubscript,
    displayName: "Script Node",

    component: ScriptNode,

    defaultData: {
        selected_scene: "Pick Scene",        
    },

    getNodeOutputData: ({ node, outputId }) => {
        const project = Project.getProject();
        console.log("GET SCRIPT DATA");

        switch (outputId) {
            case "full_script":
                return project.script?.text ?? "";

            case "selected_scene": {
                const selectedScene = node.data.selected_scene as string;

                if (selectedScene === "FULL SCRIPT") {
                    return project.script?.text ?? "";
                }

                return (
                    project.script?.scenes.get(selectedScene) ?? ""
                );
            }

            default:
                throw new Error(
                    `Unknown output "${outputId}" for Script Node`
                );
        }
    },
};