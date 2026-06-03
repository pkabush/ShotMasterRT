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
    SelectionMode,
    ReactFlowProvider,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { TextNode } from "./Nodes/TextNode";
import { Button, Stack } from "react-bootstrap";
import type { LocalJson } from "../../classes/LocalJson";

import { useCallback, useEffect, useState } from "react";
import { nb_GoogleAI } from "./Nodes/GoogleTextModelNode";
import { LocalImageNode } from "./Nodes/LocalImageNode";
import { LocalFileProvider } from "./Context/LocalFileContext";
import { useNodeGraphApi } from "./nodeGraphApi";
import { FlowClipboard } from "./Tools/FLowClipboard";
import { toJS } from "mobx";
import { KlingNode } from "./Nodes/KlingNode";
import { ShotTasksNode } from "./Nodes/ShotTasksNode";
import { MergeNode } from "./Nodes/MergeNode";
import { SeedanceNode } from "./Nodes/SeedanceNode";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faA, faBook, faClapperboard, faCodeBranch, faFileArrowDown, faFilm, faFish, faFloppyDisk, faImage, faListOl } from "@fortawesome/free-solid-svg-icons";
import { Scene } from "../../classes/Scene";



export const nodeTypes = {
    textNode: TextNode,
    googleAiNode: nb_GoogleAI,
    localImageNode: LocalImageNode,
    klingNode: KlingNode,
    tasksNode: ShotTasksNode,
    mergeNode: MergeNode,
    seedanceNode: SeedanceNode,
};

export type NodeType = keyof typeof nodeTypes;

export const MultiInputNodes = [
    "googleAiNode",
    "mergeNode",
];


interface SceneNodeBuilderProps {
    nodegraphJson: LocalJson;
}

export const SceneNodeBuilderWithProvider: React.FC<SceneNodeBuilderProps> = ({ nodegraphJson }) => {
    return <ReactFlowProvider>
        <SceneNodeBuilder nodegraphJson={nodegraphJson} />
    </ReactFlowProvider>
}

export const SceneNodeBuilder: React.FC<SceneNodeBuilderProps> = ({ nodegraphJson }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

    // Minimap Toggle
    const [showMiniMap, setShowMiniMap] = useState(false);
    const toggleMiniMap = useCallback(() => { setShowMiniMap((v) => !v); }, []);

    const nodegraph_api = useNodeGraphApi();


    const exportFlow = useCallback(() => {
        nodegraphJson.updateField("nodegraphs/nodegraph_001", { nodes, edges, });
    }, [nodegraphJson, nodes, edges]);

    const loadFlow = useCallback(() => {
        const loaded_ng = toJS(nodegraphJson.getField("nodegraphs/nodegraph_001"))
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

    const onDragOver = useCallback((event: any) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);



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
                selectionMode={SelectionMode.Partial}

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

                onDrop={async (e) => {
                    e.preventDefault();
                    //console.log("DROP IT", e);

                    const local_file_path = e.dataTransfer.getData("LocalFilePath");
                    if (local_file_path) {
                        //console.log(local_file_path, e);
                        nodegraph_api.addNode("localImageNode",
                            nodegraph_api.screenToFlowPosition({ x: e.clientX, y: e.clientY })
                            , { path: local_file_path }, [300, 400]);
                    }

                    const files = Array.from(e.dataTransfer.files);
                    if (files.length > 0) {
                        console.log(files);
                        const parentFolder = nodegraphJson.parentFolder;
                        const save_files = await parentFolder!.saveFiles(files);
                        let offset = 0;
                        for (const file of save_files) {
                            nodegraph_api.addNode("localImageNode",
                                nodegraph_api.screenToFlowPosition({ x: e.clientX, y: e.clientY + offset })
                                , { path: file.path }, [300, 400]);
                            offset += 300;
                        }
                    }


                }}
                onDragOver={onDragOver}


            >
                <Background bgColor="#313131" />
                <Controls />
                {showMiniMap ? <MiniMap /> : null}

                <FlowClipboard />

                <Panel position="top-left">
                    <Stack gap={1}>
                        <Button variant="secondary" onClick={() => { console.log({ nodes, edges,nodegraphJson }) }}>
                            <FontAwesomeIcon icon={(nodegraphJson.parentFolder! instanceof Scene) ? faFilm : faClapperboard} />
                            {nodegraphJson.parentFolder!.name}
                            </Button>
                        <Button onClick={exportFlow} size="sm" variant="success"> <FontAwesomeIcon icon={faFloppyDisk} /> Save</Button>
                        <Button onClick={loadFlow} size="sm"  variant="secondary"> <FontAwesomeIcon icon={faFileArrowDown} /> Load</Button>
                        <AddNodeUIPanel></AddNodeUIPanel>
                        <Button
                            size="sm"
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
        <Button size="sm" variant="warning" onClick={() => addNode("textNode")}><FontAwesomeIcon icon={faA} /> Text Node</Button>
        <Button size="sm" variant="warning" onClick={() => addNode("localImageNode")}><FontAwesomeIcon icon={faImage} /> LocalImage</Button>
        <Button size="sm" variant="warning" onClick={() => addNode("googleAiNode")}><FontAwesomeIcon icon={faBook} /> Google</Button>        
        <Button size="sm" variant="warning" onClick={() => addNode("klingNode")}><FontAwesomeIcon icon={faFilm} /> Kling</Button>
        <Button size="sm" variant="warning" onClick={() => addNode("seedanceNode")}><FontAwesomeIcon icon={faFish} /> Seedance</Button>
        <Button size="sm" variant="warning" onClick={() => addNode("tasksNode")}><FontAwesomeIcon icon={faListOl} /> Tasks</Button>
        <Button size="sm" variant="warning" onClick={() => addNode("mergeNode")}><FontAwesomeIcon icon={faCodeBranch} /> Merge</Button>
    </>


}