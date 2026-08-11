import { memo, useEffect } from "react";
import { useStore, useUpdateNodeInternals, type Node, type NodeProps } from "@xyflow/react";
import { NamedInputHandle, NamedOutputHandle } from "../Atomic/NamedInput";
import type { NodeDefinition } from "../NodeDefinition/NodeDefinition";
import { faCodeBranch } from "@fortawesome/free-solid-svg-icons";
import { Button } from "react-bootstrap";
import { useNodeGraphApi } from "../nodeGraphApi";

export type MergeNodeModelData = {
    iterate: boolean,
};

export type MergeNodeModelType = Node<MergeNodeModelData, "mergeNode">;

export const MergeNode = memo(
    ({ id, data, selected }: NodeProps<MergeNodeModelType>) => {
        const nodegraph_api = useNodeGraphApi();

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
                    //minWidth: 240,
                    width: 240,
                    height: Math.max((incomingCount+1)*20 + 16,100),                    
                    position: "relative",
                }}
            >

                <div style={{ fontSize: 12, marginBottom: 8, opacity: 0.7 }}>
                    Merge
                </div>

                <Button size="sm" variant={data.iterate ? "warning" : "outline-secondary"}
                    onClick={() => {
                        nodegraph_api.setNodeData(id,
                            (d) => ({ iterate: !d.iterate, })
                        )
                    }}>
                    {(data.iterate ?? false) ? "Iterate:ON" : "Iterate:OFF"}
                </Button>


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




export const MergeNodeDefinition: NodeDefinition<MergeNodeModelData, "mergeNode", any> = {
    type: "mergeNode",
    icon: faCodeBranch,
    displayName: "Merge",

    component: MergeNode,

    defaultData: {
        iterate: false,
    },

    getNodeOutputData: ({ node, api }) => {

        const multiInputs = api.getConnectedMultiInputNames(node.id);
        const output = multiInputs.map(inputName => api.in2Data(node.id, inputName));

        if (node.data.iterate) {
            //console.log("input data iterated", [output]);
            return [output];
        }

        //console.log("input data", output.flat(1));
        return output.flat(1);
    },
};
