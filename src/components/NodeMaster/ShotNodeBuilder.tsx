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
    useReactFlow,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { TextNode } from "./Nodes/TextNode";
import { Button, Stack } from "react-bootstrap";
import type { LocalJson } from "../../classes/LocalJson";

import { useCallback, useEffect, useRef, useState } from "react";
import { nb_GoogleAI } from "./Nodes/GoogleTextModelNode";
import { LocalImageNode } from "./Nodes/LocalImageNode";
import { LocalFileProvider } from "./Context/LocalFileContext";
import { useNodeGraphApi } from "./nodeGraphApi";
import { toJS } from "mobx";



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



    const mousePositionRef = useRef({ x: 0, y: 0 });

    const copySelected = useCallback(async () => {
        const selectedNodes = nodes.filter((n) => n.selected);

        if (selectedNodes.length === 0) return;

        const nodeIds = new Set(selectedNodes.map((n) => n.id));

        const selectedEdges = edges.filter(
            (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
        );

        const clipboardPayload = {
            nodes_data: {
                nodes: selectedNodes.map((n) => ({
                    id: n.id,
                    type: n.type,
                    height: n.height,
                    width: n.width,
                    position: { ...n.position },
                    data: toJS(n.data),
                })),

                edges: selectedEdges.map((e) => ({
                    id: e.id,
                    source: e.source,
                    target: e.target,
                    sourceHandle: e.sourceHandle,
                    targetHandle: e.targetHandle,
                    type: e.type,
                    data: toJS(e.data),
                })),
            },
        };

        try {
            await navigator.clipboard.writeText(
                JSON.stringify(clipboardPayload, null, 2)
            );

            console.log("Copied", clipboardPayload);
        } catch (err) {
            console.error("Copy failed", err);
        }
    }, [nodes, edges]);

    const pasteSelected = useCallback(async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (!text) return;
            const parsed = JSON.parse(text);

            if (
                !parsed ||
                typeof parsed !== "object" ||
                !parsed.nodes_data
            ) {
                console.warn("Clipboard does not contain valid node data");
                return;
            }

            const clipboardData = parsed.nodes_data;

            const idMap = new Map<string, string>();

            const newNodes: Node[] = clipboardData.nodes.map((node: any) => {
                const newId = crypto.randomUUID();

                idMap.set(node.id, newId);

                return {
                    ...node,
                    id: newId,
                    selected: true,
                    position: {
                        x: node.position.x + 40,
                        y: node.position.y + 40,
                    },
                };
            });

            const newEdges: Edge[] = clipboardData.edges.map((edge: any) => ({
                ...edge,
                id: crypto.randomUUID(),
                source: idMap.get(edge.source)!,
                target: idMap.get(edge.target)!,
            }));

            setNodes((nds) => [
                ...nds.map((n) => ({
                    ...n,
                    selected: false,
                })),
                ...newNodes,
            ]);

            setEdges((eds) => [...eds, ...newEdges]);

            console.log("Pasted", clipboardData);
        } catch (err) {
            console.error("Paste failed", err);
        }
    }, [setNodes, setEdges]);





    useEffect(() => { loadFlow(); }, [nodegraphJson, loadFlow])

    // Kyeboard Shortcuts
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const isCopy = (e.ctrlKey || e.metaKey) && e.code === "KeyC";
            const isPaste = (e.ctrlKey || e.metaKey) && e.code === "KeyV";

            if (isCopy) {
                e.preventDefault();
                copySelected();
            }

            if (isPaste) {
                e.preventDefault();
                pasteSelected();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => { window.removeEventListener("keydown", onKeyDown); };
    }, [copySelected, pasteSelected]);

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

                minZoom={0.025}
                maxZoom={20}

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

                defaultEdgeOptions={{
                    style: {
                        strokeWidth: 5,
                        stroke: "#81b5ff",
                    },
                }}

                onPaneMouseMove={(event) => {
                    console.log(event);
                    const bounds = event.currentTarget.getBoundingClientRect();

                    mousePositionRef.current = {
                        x: event.clientX - bounds.left,
                        y: event.clientY - bounds.top,
                    };                    
                    //console.log(mousePositionRef.current);
                }}


            >
                <Background bgColor="#313131" />
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

                        <Button onClick={copySelected}>Copy</Button>
                        <Button onClick={pasteSelected}>Paste</Button>

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