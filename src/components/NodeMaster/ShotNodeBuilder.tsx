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
import { LocalImageNode } from "./Nodes/LocalImageNode";
import { LocalFileProvider } from "./Context/LocalFileContext";
import {  useNodeGraphApi } from "./nodeGraphApi";



export const nodeTypes = {
    textNode: TextNode,
    googleAiNode: nb_GoogleAI,
    localImageNode: LocalImageNode,
};

export type NodeType = keyof typeof nodeTypes;

export const MultiInputNodes = [
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

    //const { addNode } = useNodeGraphApi();

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
        <LocalFileProvider local_file={nodegraphJson}>

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
                        <AddNodeUIPanel></AddNodeUIPanel>
                        <Button
                            variant={showMiniMap ? "secondary" : "outline-secondary"}
                            onClick={toggleMiniMap}
                        >
                            {showMiniMap ? "Hide Minimap" : "Show Minimap"}
                        </Button>

                    </Stack>
                </Panel>
            </ReactFlow>
        </LocalFileProvider>
    </div >


}


const AddNodeUIPanel = () => {

    const { addNode } = useNodeGraphApi();

    return <>
        <Button onClick={() => addNode("textNode")}>+ Text Node</Button>
        <Button onClick={() => addNode("googleAiNode")}>+ GoogleNode</Button>
        <Button onClick={() => addNode("localImageNode")}>+ LocalImage</Button>
    </>


}