import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Panel,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { TextNode } from "./Nodes/TextNode";
import { Button, Stack } from "react-bootstrap";
import type { LocalJson } from "../../classes/LocalJson";

import { useCallback, useEffect, useState } from "react";


const initialNodes = [
    { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
    { id: 'n2', position: { x: 0, y: 100 }, data: { label: 'Node 2' } },
    {
        id: "n3",
        type: "textNode",
        position: { x: 100, y: 100 },
        data: {
            text: "Hello",
        },
    },
];
const initialEdges = [{ id: 'n1-n2', source: 'n1', target: 'n2' }];


const nodeTypes = {
    textNode: TextNode,
};

interface SceneNodeBuilderProps {
    nodegraphJson: LocalJson;
}

export const SceneNodeBuilder: React.FC<SceneNodeBuilderProps> = ({ nodegraphJson }) => {

    //console.log(nodegraphJson.getField("nodegraphs/nodegraph_001"));

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Minimap Toggle
    const [showMiniMap, setShowMiniMap] = useState(true);
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
                setEdges((eds) => addEdge(c, eds))
            }
            colorMode={'dark'}
            snapToGrid
            snapGrid={[20, 20]} // grid size (x, y)

            multiSelectionKeyCode="Ctrl"
            selectionKeyCode="Ctrl"
            selectionOnDrag

            deleteKeyCode={["Delete"]}

            onNodesDelete={(deleted) => {
                setNodes((nds) => nds.filter((n) => !deleted.find((d) => d.id === n.id)));
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
                    <Button
                        variant={showMiniMap ? "secondary" : "outline-secondary"}
                        onClick={toggleMiniMap}
                    >
                        {showMiniMap ? "Hide Minimap" : "Show Minimap"}
                    </Button>

                </Stack>
            </Panel>

        </ReactFlow>

    </div>


}