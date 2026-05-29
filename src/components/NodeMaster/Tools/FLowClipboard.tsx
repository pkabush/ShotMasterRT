import { useCallback, useEffect, useRef } from "react";
import { useReactFlow, type Node, type Edge } from "@xyflow/react";
import { toJS } from "mobx";
import { useNodeGraphApi } from "../nodeGraphApi";

export const FlowClipboard = () => {
    const {
        getNodes,
        getEdges,
        setNodes,
        setEdges,
        screenToFlowPosition,
    } = useReactFlow();

    const nodegraph_api = useNodeGraphApi();
    // cursor in FLOW coordinates
    const mouseRef = useRef({ x: 0, y: 0 });

    /**
     * Track mouse position in flow space
     */
    const onMouseMove = useCallback(
        (event: MouseEvent) => {
            mouseRef.current = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });
        },
        [screenToFlowPosition]
    );

    /**
     * COPY
     */
    const copySelected = useCallback(async () => {
        const nodes = getNodes();
        const edges = getEdges();

        const selectedNodes = nodes.filter((n) => n.selected);
        if (!selectedNodes.length) return;

        const nodeIds = new Set(selectedNodes.map((n) => n.id));

        const selectedEdges = edges.filter(
            (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
        );

        const payload = {
            nodes_data: {
                nodes: selectedNodes.map((n) => ({
                    id: n.id,
                    type: n.type,
                    position: n.position,
                    width: n.width,
                    height: n.height,
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
                JSON.stringify(payload, null, 2)
            );
        } catch (err) {
            console.error("Copy failed", err);
        }
    }, [getNodes, getEdges]);

    /**
     * PASTE (cursor aligned)
     */
    const pasteSelected = useCallback(async () => {
        const text = await navigator.clipboard.readText();
        if (!text) return;

        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch {
            console.warn("Invalid clipboard JSON");
            return;
        }

        const data = parsed?.nodes_data;
        if (data?.nodes?.length) {

            const idMap = new Map<string, string>();

            // --- bounding box of copied nodes
            let minX = Infinity;
            let minY = Infinity;

            for (const n of data.nodes) {
                minX = Math.min(minX, n.position.x);
                minY = Math.min(minY, n.position.y);
            }

            // --- cursor in FLOW space
            const cursor = mouseRef.current;

            const offsetX = cursor.x - minX;
            const offsetY = cursor.y - minY;

            // --- new nodes
            const newNodes: Node[] = data.nodes.map((n: any) => {
                const newId = crypto.randomUUID();
                idMap.set(n.id, newId);

                return {
                    ...n,
                    id: newId,
                    selected: true,
                    position: {
                        x: n.position.x + offsetX,
                        y: n.position.y + offsetY,
                    },
                };
            });

            // --- new edges remapped
            const newEdges: Edge[] = data.edges.map((e: any) => ({
                ...e,
                id: crypto.randomUUID(),
                source: idMap.get(e.source)!,
                target: idMap.get(e.target)!,
            }));

            // --- update graph safely
            setNodes((nds) => [
                ...nds.map((n) => ({ ...n, selected: false })),
                ...newNodes,
            ]);

            setEdges((eds) => [...eds, ...newEdges]);
        }

        // Local Path Present
        if (parsed.local_path) {
            console.log("Buffer", parsed);
            const cursor = mouseRef.current;
            nodegraph_api.addNode("localImageNode", cursor, { path: parsed.local_path }, [300, 400]);

        }


    }, [setNodes, setEdges]);

    /**
     * Keyboard shortcuts
     */
    useEffect(() => {
        const isEditableElement = (el: EventTarget | null) => {
            if (!(el instanceof HTMLElement)) return false;

            return (
                el.tagName === "INPUT" ||
                el.tagName === "TEXTAREA" ||
                el.isContentEditable
            );
        };


        const onKeyDown = (e: KeyboardEvent) => {
            // allow normal text copy/paste inside editors
            if (isEditableElement(e.target)) {
                return;
            }

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
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [copySelected, pasteSelected]);

    /**
     * Mouse tracking
     */
    useEffect(() => {
        window.addEventListener("mousemove", onMouseMove);
        return () => window.removeEventListener("mousemove", onMouseMove);
    }, [onMouseMove]);

    return null;
};