import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Panel,
    type Edge,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { TextNode } from "./Nodes/TextNode";
import { Button, Stack } from "react-bootstrap";
import type { LocalJson } from "../../classes/LocalJson";

import { useCallback, useEffect, useState } from "react";
import { nb_GoogleAI } from "./Nodes/GoogleTextModel";
import { LocalImageNode } from "./Nodes/nb_LocalImage";



const nodeTypes = {
    textNode: TextNode,
    googleAiNode: nb_GoogleAI,
    localImageNode: LocalImageNode,
};

const MultiInputNodes = [
    "googleAiNode",
];

interface SceneNodeBuilderProps {
    nodegraphJson: LocalJson;
}

export const SceneNodeBuilder: React.FC<SceneNodeBuilderProps> = ({ nodegraphJson }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

    // Minimap Toggle
    const [showMiniMap, setShowMiniMap] = useState(false);
    const toggleMiniMap = useCallback(() => { setShowMiniMap((v) => !v); }, []);

    const addTextNode = useCallback(() => {
        const id = crypto.randomUUID();
        setNodes((nds) => [
            ...nds,
            {
                id,
                type: "textNode",
                position: { x: 100, y: 100 },
                data: { text: "New node" },
            },
        ]);
    }, [setNodes]);

    const addLocalImageNode = useCallback(() => {
        const id = crypto.randomUUID();
        setNodes((nds) => [
            ...nds,
            {
                id,
                type: "localImageNode",
                position: { x: 100, y: 100 },
                data: { path: "" },
            },
        ]);
    }, [setNodes]);

    const addGoogleAiNode = useCallback(() => {
        const id = crypto.randomUUID();

        setNodes((nds) => [
            ...nds,
            {
                id,
                type: "googleAiNode",
                position: { x: 100, y: 100, },
                data: {
                    prompt: "Ask something...",
                    response: "",
                },
            },
        ]);
    }, [setNodes]);

    const exportFlow = useCallback(() => {
        nodegraphJson.updateField("nodegraphs/nodegraph_001", { nodes, edges, });
    }, [nodegraphJson, nodes, edges]);

    const loadFlow = useCallback(() => {
        const loaded_ng = nodegraphJson.getField("nodegraphs/nodegraph_001")
        if (loaded_ng) {
            setNodes(loaded_ng.nodes);
            setEdges(loaded_ng.edges);
        }
        else {
            setNodes([]);
            setEdges([]);
        }
    }, [nodegraphJson]);

    useEffect(() => { loadFlow(); }, [nodegraphJson, loadFlow])

    return <div style={{
        width: "100%",
        height: "80vh",
    }}>


        <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={(c) =>
                //setEdges((eds) => addEdge(c, eds))                
                setEdges((eds) => {
                    const filtered = eds.filter(
                        (e) =>
                            !(
                                e.target === c.target &&
                                e.targetHandle === c.targetHandle
                            )
                    );



                    return addEdge(c, filtered);
                })
            }
            colorMode={'dark'}
            snapToGrid
            snapGrid={[20, 20]} // grid size (x, y)

            multiSelectionKeyCode="Shift"
            selectionKeyCode="Shift"
            selectionOnDrag

            deleteKeyCode={["Delete"]}

            onNodesDelete={(deleted) => {
                setNodes((nds) => nds.filter((n) => !deleted.find((d) => d.id === n.id)));
            }}

            onEdgesDelete={(deletedEdges) => {
                // remove deleted ones
                const remaining = edges.filter((e) => !deletedEdges.some((d) => d.id === e.id));

                // Update MultiInputNodes
                const remapped: Edge[] = [...remaining];
                nodes.forEach((n) => {
                    if (MultiInputNodes.includes(n.type)) {
                        const incoming = remaining.filter((e) => e.target === n.id)
                            .sort((a, b) => {
                                const aIndex = parseInt(a.targetHandle?.replace("input_", "") ?? "0");
                                const bIndex = parseInt(b.targetHandle?.replace("input_", "") ?? "0");
                                return aIndex - bIndex;
                            });

                        // reassign sequentially
                        incoming.forEach((edge, index) => {
                            const idx = remapped.findIndex((e) => e.id === edge.id);
                            if (idx === -1) return;
                            remapped[idx] = { ...edge, targetHandle: `input_${index}`, };
                        });
                    }
                })

                setEdges(remapped);
            }}

        >
            <Background />
            <Controls />
            {showMiniMap ? <MiniMap /> : null}

            <Panel position="top-left">
                <Stack gap={1}>
                    <Button onClick={exportFlow}>Save</Button>
                    <Button onClick={loadFlow}>Load</Button>
                    <Button onClick={addTextNode}>+ Text Node</Button>                    
                    <Button onClick={addGoogleAiNode}>+ GoogleNode</Button>
                    <Button onClick={addLocalImageNode}>+ LocalImage</Button>
                    <Button
                        variant={showMiniMap ? "secondary" : "outline-secondary"}
                        onClick={toggleMiniMap}
                    >
                        {showMiniMap ? "Hide Minimap" : "Show Minimap"}
                    </Button>

                </Stack>
            </Panel>

        </ReactFlow>

    </div >


}