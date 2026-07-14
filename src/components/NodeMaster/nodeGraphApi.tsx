// useNodeGraphApi.ts

import { useCallback, useEffect } from "react";
import { useReactFlow, type XYPosition, type Node, type Edge, useUpdateNodeInternals, useStore } from "@xyflow/react";
import type { NodeType } from "./ShotNodeBuilder";
import { KlingAI } from "../../classes/KlingAI";
import { SeedanceAI } from "../../classes/AiProviders/Byteplus";
import { LocalImage } from "../../classes/fileSystem/LocalImage";
import { Project } from "../../classes/Project";
import { GoogleAI } from "../../classes/GoogleAI";
import type { LocalFile } from "../../classes/fileSystem/LocalFile";


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

    // Basic Actions
    const id2Node = useCallback(
        (id: string): Node | undefined => {
            return getNodes().find((n) => n.id === id);
        },
        [getNodes]
    );
    const addNode = useCallback(
        (
            type: NodeType,
            positionOrNode?: XYPosition | string,
            data: Record<string, any> = {},
            size?: [number, number] // [width, height]
        ) => {
            const id = crypto.randomUUID();

            // CALC Node Position - can be based on position, node_id as output, dragged position
            let finalPosition: XYPosition;
            if (typeof positionOrNode === "string") {
                const node = id2Node(positionOrNode);

                if (node) {
                    const width = node.measured?.width ?? node.width ?? 400;

                    finalPosition = {
                        x: node.position.x + width + 120,
                        y: node.position.y,
                    };
                } else {
                    finalPosition = screenToFlowPosition({
                        x: window.innerWidth / 2,
                        y: window.innerHeight / 2,
                    });
                }
            } else if (positionOrNode) {
                finalPosition = positionOrNode;
            } else {
                finalPosition = screenToFlowPosition({
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2,
                });
            }

            // Create Node
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

            // After Node Created Do Stuff
            switch (type) {
                case "mergeNode":
                    let input_index = 0;
                    for (const node of getSelectedNodes()) {
                        if (node.type === "localImageNode") {
                            connect(node.id, id, "path", `input_${input_index}`);
                            input_index++;
                        }
                    }
                    break;
                default:
                    break;
            }

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

    // Nodes Filtering/searchign
    const getSelectedNodes = useCallback((): Node[] => {
        return getNodes().filter((node) => node.selected);
    }, [getNodes]);


    // OUTPUTS AND INPUTS
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

    // Node Data
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
            updateNodeInternals(id);
        },
        [setNodes]
    );

    // Dynamic Input UTILS
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


    // Message inputs gather
    async function gatherInputMessages(nodeId: string) {
        const project = Project.getProject();
        const inputNodes = getIndexedInputNodes(nodeId);

        const messages: any[] = [];

        for (const node of inputNodes) {
            if (!node) continue;

            switch (node.type) {
                case "textNode":
                    if (node.data.text) {
                        messages.push(node.data.text as string);
                    }
                    break;

                case "localImageNode":
                    if (node.data.path) {
                        const image = project.getByAbsPath(node.data.path as string);
                        if (image instanceof LocalImage) {
                            messages.push(await image.getAIImage());
                        }
                    }
                    break;

                case "mergeNode":
                    const merge_messages = await gatherInputMessages(node.id);
                    //console.log("Merge Node Messages", merge_messages);
                    messages.push(merge_messages);
                    break;


                default:
                    break;
            }
        }
        return messages;
    }
    function iterateMessagePacks(messages: any[]): any[][] {
        function expand(items: any[]): any[][] {
            let packs: any[][] = [[]];

            for (const item of items) {
                if (Array.isArray(item)) {
                    // Every element of this array is an alternative
                    const next: any[][] = [];

                    for (const option of item) {
                        const optionPacks = Array.isArray(option)
                            ? expand(option) // nested branch
                            : [[option]];    // single message

                        for (const pack of packs) {
                            for (const optionPack of optionPacks) {
                                next.push([...pack, ...optionPack]);
                            }
                        }
                    }

                    packs = next;
                } else {
                    // Sequential message: append to every pack
                    for (const pack of packs) {
                        pack.push(item);
                    }
                }
            }

            return packs;
        }

        return expand(messages);
    }

    // Save AI Image/Text Response
    const saveAiTextImageResponse = useCallback(
        async (nodeId: string, res: any, local_file: LocalFile) => {
            if (typeof res !== "string") {
                // Image Response
                const outImageNode = getOutputNodes(nodeId, "out_image", "localImageNode")[0];
                if (!outImageNode) {
                    // Dont Have Image Node
                    const savedImage = await GoogleAI.saveResultImage(res, local_file.parentFolder!);
                    if (!savedImage) return;
                    const newId = addNode("localImageNode", nodeId, { path: savedImage.path, });
                    connect(nodeId, newId, "out_image", "path");
                } else {
                    // Have Image Node
                    const resImage = local_file.getByAbsPath(outImageNode.data.path as string) ?? local_file;
                    const savedImage = await GoogleAI.saveResultImage(res, resImage.parentFolder!);
                    if (savedImage) { setNodeData(outImageNode.id, { path: savedImage.path, }); }
                }
                return;
            }

            // Text response
            const outTextNode = getOutputNodes(nodeId, "out_text", "textNode")[0];

            if (!outTextNode) {
                const newId = addNode("textNode", nodeId, { text: res, });
                connect(nodeId, newId, "out_text", "input_0");
            } else {
                setNodeData(outTextNode.id, { text: res, });
            }
        },
        [addNode, connect, getOutputNodes, setNodeData]
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
        screenToFlowPosition,
        getNamedInputNodes,
        nodeMap2IndexedNodes,
        getIndexedInputNodes,
        getIncomingCount,
        useDynamicInputHandles,
        gatherInputMessages,
        iterateMessagePacks,
        saveAiTextImageResponse,
        getSelectedNodes
    };
}
