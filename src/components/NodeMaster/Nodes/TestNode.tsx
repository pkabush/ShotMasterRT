import { memo } from "react";
import {
    type Node,
    type NodeProps,
} from "@xyflow/react";
import { NamedInputHandle, NamedOutputHandle } from "../Atomic/NamedInput";
import { Button } from "react-bootstrap";
import { useNodeGraphApi } from "../nodeGraphApi";
import { nodeDefinitions, type NodeType } from "../ShotNodeBuilder";
import type { NodeDefinition } from "../NodeDefinition/NodeDefinition";
import { faKey } from "@fortawesome/free-solid-svg-icons";

export type TestNodeData = {
};

export type TestNodeType = Node<TestNodeData, "testNode">;


export const TestNode = memo(
    ({ id, selected }: NodeProps<TestNodeType>) => {

        const nodegraph_api = useNodeGraphApi();

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

                        const input = nodegraph_api.in2out(id, "in");
                        console.log(input);

                        if (!input?.node.type) return;
                        const node_definition = nodeDefinitions[input.node.type as NodeType];
                        if(!node_definition.getNodeOutputData) return;
                        const data = node_definition.getNodeOutputData(
                            {
                                node: input.node,
                                outputId: input.output_key,
                            }

                        );

                        console.log("out_data", data);

                    }}>
                    Log Input
                </Button>


                <NamedInputHandle id="in" />
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
