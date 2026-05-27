import { memo, useEffect } from "react";
import { useStore, useUpdateNodeInternals, type Node, type NodeProps } from "@xyflow/react";
import { NamedInputHandle, NamedOutputHandle } from "../Atomic/NamedInput";


export type MergeNodeModelData = {

};

export type MergeNodeModelType = Node<MergeNodeModelData, "mergeNode">;

export const MergeNode = memo(
    ({ id, selected }: NodeProps<MergeNodeModelType>) => {

        const incomingCount = useStore(
            (state) => state.edges.reduce((acc, e) => (e.target === id ? acc + 1 : acc), 0)
        );

        const updateNodeInternals = useUpdateNodeInternals();

        useEffect(() => {
            updateNodeInternals(id);
        }, [incomingCount, id, updateNodeInternals]);


        return (
            <div
                style={{
                    background: "#111",
                    color: "white",
                    border: selected ? "2px solid #4da3ff" : "1px solid #333",
                    borderRadius: 12,
                    padding: 12,
                    minWidth: 240,
                    position: "relative",
                }}
            >

                <div style={{ fontSize: 12, marginBottom: 8, opacity: 0.7 }}>
                    Merge
                </div>


                {/* OUTPUT HANDLE */}
                <NamedOutputHandle id="out" />
                {/* Multi INPUT HANDLE */}
                {Array.from({ length: incomingCount + 1 }).map((_, index) => (
                    <NamedInputHandle id={`input_${index}`} index={index} />
                ))}

            </div >
        );
    }
);

MergeNode.displayName = "ButtonNode";



