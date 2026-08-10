import { memo } from "react";
import {
    type Node,
    type NodeProps,
} from "@xyflow/react";
import { NamedInputHandle, NamedOutputHandle } from "../Atomic/NamedInput";
import { Button } from "react-bootstrap";
import { useNodeGraphApi } from "../nodeGraphApi";
import type { NodeDefinition } from "../NodeDefinition/NodeDefinition";
import { faKey } from "@fortawesome/free-solid-svg-icons";

export type TestNodeData = {
};

export type TestNodeType = Node<TestNodeData, "testNode">;


export const TestNode = memo(
    ({ id, selected }: NodeProps<TestNodeType>) => {

        const nodegraph_api = useNodeGraphApi();

        const incomingCount = nodegraph_api.useDynamicInputHandles(id);



        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    boxSizing: "border-box",

                    display: "flex",
                    flexDirection: "column",

                    background: "#111",
                    color: "white",

                    border: selected
                        ? "2px solid #4da3ff"
                        : "1px solid #333",

                    borderRadius: 12,
                    padding: 12,

                    minWidth: 200,
                    minHeight: 100,

                    boxShadow: selected
                        ? "0 0 0 2px rgba(77,163,255,0.3)"
                        : "none",

                    transition: "all 0.15s ease",
                }}
            >
                <div
                    style={{
                        fontSize: 12,
                        marginBottom: 8,
                        opacity: 0.7,
                    }}
                >
                    TEST Node
                </div>

                <Button size="sm" variant="warning"
                    onClick={() => {
                        console.log(nodegraph_api.in2Data(id, "input_0"));
                    }}>
                    Log Input_0
                </Button>

                <Button size="sm" variant="warning"
                    onClick={() => {

                        const multiInputs = nodegraph_api.getConnectedMultiInputNames(id);
                        const output = multiInputs.map(inputName => nodegraph_api.in2Data(id, inputName));
                        
                        console.log("MULTI INPUT DATA", output);

                    }}>
                    Log All Inputs
                </Button>





                {/* Multi INPUT HANDLE */}
                {Array.from({ length: incomingCount + 1 }).map((_, index) => (
                    <NamedInputHandle id={`input_${index}`} index={index} key={index} />
                ))}

                <NamedOutputHandle id="out" />


            </div >
        );
    }
);

TestNode.displayName = "TestNode";

export const TestNodeDefinition: NodeDefinition<TestNodeData, "testNode", any> = {
    type: "testNode",
    icon: faKey,
    displayName: "TEST",

    component: TestNode,

    defaultData: {
    },

    getNodeOutputData: ({ node, outputId }) => {
        console.log("GET", node, outputId);
        return null
    },
};
