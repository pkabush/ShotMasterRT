
import type { ComponentType } from "react";
import type { Node, NodeProps, } from "@xyflow/react";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import type { NodeGraphApi } from "../nodeGraphApi";



export type NodeDefinition<
    TData extends Record<string, unknown>,
    TType extends string,
    TOutput = unknown
> = {
    type: TType;
    displayName: string;
    icon: IconDefinition;

    component: ComponentType<NodeProps<Node<TData, TType>>>;

    defaultData: TData;

    getNodeOutputData?: (args: {
        node: Node;
        outputId: string;
        api: NodeGraphApi;
    }) => TOutput;

    /** Optional lifecycle / behavior functions */
    onCreate?: (node: Node<TData, TType>) => void;
    onDelete?: (node: Node<TData, TType>) => void;

    operations?: any;
};

export type AnyNodeDefinition = NodeDefinition<
    Record<string, unknown>,
    string,
    unknown
>;

export type NodeDefinitionMetadata = {
    type: string;
    displayName: string;
    icon: IconDefinition;
};
