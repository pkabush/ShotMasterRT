// useNodeGraphApi.ts

import { useCallback, useEffect } from "react";
import { useReactFlow, type XYPosition, type Node, type Edge, useUpdateNodeInternals, useStore } from "@xyflow/react";
import type { NodeType } from "./ShotNodeBuilder";
import { KlingAI } from "../../classes/KlingAI";
import { SeedanceAI } from "../../classes/AiProviders/Byteplus";



const defaultNodeData: Record<NodeType, any> = {
    textNode: {
        text: "New node",
    },
    googleAiNode: {
        prompt: "Ask something...",
        response: "",
    },
    localImageNode: {
        path: "",
    },
    klingNode: {
        model: KlingAI.options.img2video.model.v3,
        mode: KlingAI.options.img2video.mode.std,
        duration: KlingAI.options.img2video.duration.five,
        sound: KlingAI.options.img2video.sound.off,
    },
    tasksNode: {
    },
    mergeNode: {

    },
    seedanceNode: {
        resolution: SeedanceAI.options.video.resolution.default,
        duration: SeedanceAI.options.video.duration.default,
        ratio: SeedanceAI.options.video.ration.adaptive,
        sound: true,
    },
    gptNode: {
        gen_image: true,
    },
};

export function useNodeGraphApi() {
    const { getNodes, setNodes, getEdges, setEdges, screenToFlowPosition } = useReactFlow();

    const updateNodeInternals = useUpdateNodeInternals();

    const id2Node = useCallback(
        (id: string): Node | undefined => {
            return getNodes().find((n) => n.id === id);
        },
        [getNodes]
    );
    const addNode = useCallback(
        (
            type: NodeType,
            position?: XYPosition,
            data: Record<string, any> = {},
            size?: [number, number] // [width, height]
        ) => {
            const id = crypto.randomUUID();

            // fallback → center of viewport
            const finalPosition =
                position ??
                screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2, });

            const newNode: Node = {
                id,
                type,
                position: finalPosition,
                data: {
                    ...defaultNodeData[type],
                    ...data,
                },
                ...(size ? { width: size[0], height: size[1], } : {}),
            };

            setNodes((nds) => [...nds, newNode]);

            return id;
        },
        [setNodes, screenToFlowPosition]
    );
    const removeNode = useCallback(
        (id: string) => {
            setNodes((nds) => nds.filter((n) => n.id !== id));
        },
        [setNodes]
    );
    const duplicateNode = useCallback(
        (id: string) => {
            const nodes = getNodes();
            const node = nodes.find((n) => n.id === id);
            if (!node) return;

            addNode(
                node.type as NodeType,
                {
                    x: node.position.x + 50,
                    y: node.position.y + 50,
                },
                node.data
            );
        },
        [getNodes, addNode]
    );
    const connect = useCallback(
        (
            node_out: string,
            node_in: string,
            output_key: string,
            input_key: string
        ) => {
            const id = crypto.randomUUID();

            const newEdge: Edge = {
                id,
                source: node_out,
                target: node_in,

                // store your custom mapping info
                data: {
                    output_key,
                    input_key,
                },

                // optional but useful if you debug later
                sourceHandle: output_key,
                targetHandle: input_key,
            };

            setEdges((eds) => [...eds, newEdge]);

            return id;
        },
        [setEdges]
    );

    const getOutputNodes = useCallback(
        (nodeId: string, sourceHandle?: string, type?: string) => {
            const nodes = getNodes();
            const edges = getEdges();

            const filteredEdges = edges.filter((e) => {
                if (e.source !== nodeId) return false;

                if (sourceHandle && e.sourceHandle !== sourceHandle) {
                    return false;
                }

                return true;
            });

            const result = filteredEdges
                .map((e) => nodes.find((n) => n.id === e.target))
                .filter(Boolean) as Node[];

            if (type) {
                return result.filter((n) => n.type === type);
            }

            return result;
        },
        [getNodes, getEdges]
    );
    const getInputNodes = useCallback(
        (nodeId: string, input_key?: string, type?: string) => {
            const nodes = getNodes();
            const edges = getEdges();

            const filteredEdges = edges.filter((e) => {
                if (e.target !== nodeId) return false;

                if (input_key && e.targetHandle !== input_key) {
                    return false;
                }

                return true;
            }).sort();

            const result = filteredEdges
                .map((e) => nodes.find((n) => n.id === e.source))
                .filter(Boolean) as Node[];

            if (type) { return result.filter((n) => n.type === type); }

            return result;
        },
        [getNodes, getEdges]
    );
    const getNamedInputNodes = useCallback(
        (nodeId: string, input_key?: string, type?: string) => {
            const nodes = getNodes();
            const edges = getEdges();

            const filteredEdges = edges.filter((e) => {
                if (e.target !== nodeId) return false;
                if (input_key && e.targetHandle !== input_key) { return false; }
                return true;
            }).sort();

            const result = filteredEdges.reduce<Record<string, Node>>((acc, e) => {
                const node = nodes.find((n) => n.id === e.source);
                if (!node) return acc;
                if (type && node.type !== type) return acc;
                acc[e.targetHandle!] = node;
                return acc;
            }, {});

            return result;
        },
        [getNodes, getEdges]
    );
    const nodeMap2IndexedNodes = useCallback(
        (namedNodes: Record<string, Node>): Node[] => {
            return Object.entries(namedNodes)
                .filter(([name]) => /^input_(\d+)$/.test(name))
                .sort(([a], [b]) => {
                    const indexA = Number(a.match(/^input_(\d+)$/)?.[1]);
                    const indexB = Number(b.match(/^input_(\d+)$/)?.[1]);
                    return indexA - indexB;
                })
                .map(([, node]) => node);
        },
        []
    );
    const getIndexedInputNodes = useCallback(
        (nodeId: string, type?: string): Node[] => {
            return nodeMap2IndexedNodes(getNamedInputNodes(nodeId, type));
        },
        [getNamedInputNodes, nodeMap2IndexedNodes]
    );


    const getNodeData = useCallback(
        (id: string) => {
            const node = getNodes().find((n) => n.id === id);
            return node?.data;
        },
        [getNodes]
    );
    const setNodeData = useCallback(
        (
            id: string,
            newDataOrUpdater:
                | Record<string, any>
                | ((data: Record<string, any>) => Record<string, any>)
        ) => {
            setNodes((nds) =>
                nds.map((n) => {
                    if (n.id !== id) return n;

                    const updates =
                        typeof newDataOrUpdater === "function"
                            ? newDataOrUpdater(n.data)
                            : newDataOrUpdater;

                    return {
                        ...n,
                        data: {
                            ...n.data,
                            ...updates,
                        },
                    };
                })
            );
        },
        [setNodes]
    );

    // Dynamic Inputs
    const getIncomingCount = useCallback(
        (id: string) => { return getEdges().reduce((acc, e) => (e.target === id ? acc + 1 : acc), 0); },
        [getEdges]
    );
    const useDynamicInputHandles = (id: string) => {
        const incomingCount = useStore(
            (state) =>
                state.edges.reduce(
                    (acc, e) => (e.target === id ? acc + 1 : acc),
                    0
                )
        );

        useEffect(() => {
            updateNodeInternals(id);
        }, [incomingCount, id, updateNodeInternals]);

        return incomingCount;
    };




    return {
        addNode,
        removeNode,
        duplicateNode,
        id2Node,
        connect,
        getOutputNodes,
        getInputNodes,
        getNodeData,
        setNodeData,
        screenToFlowPosition,
        getNamedInputNodes,
        nodeMap2IndexedNodes,
        getIndexedInputNodes,
        getIncomingCount,
        useDynamicInputHandles
    };
}
