// useNodeGraphApi.ts

import { useCallback } from "react";
import { useReactFlow, type XYPosition, type Node, type Edge } from "@xyflow/react";
import type { NodeType } from "./ShotNodeBuilder";



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
};

export function useNodeGraphApi() {
    const { getNodes, setNodes, getEdges, setEdges, } = useReactFlow();

    const id2Node = useCallback(
        (id: string): Node | undefined => {
            return getNodes().find((n) => n.id === id);
        },
        [getNodes]
    );

    const addNode = useCallback(
        (
            type: NodeType,
            position: XYPosition = { x: 100, y: 100 },
            data: Record<string, any> = {}
        ) => {
            const id = crypto.randomUUID();

            const newNode: Node = {
                id,
                type,
                position,
                data: {
                    ...defaultNodeData[type],
                    ...data,
                },
            };

            setNodes((nds) => [...nds, newNode]);

            return id;
        },
        [setNodes]
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

    /**
 * Get nodes that this node outputs to (downstream)
 */
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

    /**
     * Get nodes that feed into this node (upstream)
     */
    const getInputNodes = useCallback(
        (nodeId: string, input_key?: string, type?: string) => {
            const nodes = getNodes();
            const edges = getEdges();

            const filteredEdges = edges.filter((e) => {
                if (e.target !== nodeId) return false;

                if (input_key && e.data?.input_key !== input_key) {
                    return false;
                }

                return true;
            });

            const result = filteredEdges
                .map((e) => nodes.find((n) => n.id === e.source))
                .filter(Boolean) as Node[];

            if (type) {
                return result.filter((n) => n.type === type);
            }

            return result;
        },
        [getNodes, getEdges]
    );

    const getNodeData = useCallback(
        (id: string) => {
            const node = getNodes().find((n) => n.id === id);
            return node?.data;
        },
        [getNodes]
    );

    const setNodeData = useCallback(
        (id: string, newData: Record<string, any>) => {
            setNodes((nds) =>
                nds.map((n) => {
                    if (n.id !== id) return n;

                    return {
                        ...n,
                        data: {
                            ...n.data,
                            ...newData,
                        },
                    };
                })
            );
        },
        [setNodes]
    );


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
    };
}