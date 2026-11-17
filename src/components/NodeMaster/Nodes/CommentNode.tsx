
import { memo, useEffect, useRef } from "react";
import {
    useReactFlow,
    NodeToolbar,
    Position,
    type Node,
    type NodeProps,
} from "@xyflow/react";

import type { NodeDefinition } from "../NodeDefinition/NodeDefinition";
import { faComment } from "@fortawesome/free-solid-svg-icons";
import { Dropdown } from "react-bootstrap";

export type CommentNodeData = {
    text: string;
    fontSize: number;
    color: string;
    backgroundColor: string;
};

export type CommentNodeType = Node<
    CommentNodeData,
    "commentNode"
>;

const TEXT_COLORS = [
    { label: "White", value: "#ffffff" },
    { label: "Black", value: "#000000" },
    { label: "Gray", value: "#9ca3af" },
    { label: "Red", value: "#ef4444" },
    { label: "Orange", value: "#f97316" },
    { label: "Yellow", value: "#eab308" },
    { label: "Green", value: "#22c55e" },
    { label: "Cyan", value: "#06b6d4" },
    { label: "Blue", value: "#3b82f6" },
    { label: "Purple", value: "#8b5cf6" },
    { label: "Pink", value: "#ec4899" },
];

const BACKGROUND_COLORS = [
    { label: "Transparent", value: "transparent" },
    { label: "Dark", value: "#27272a" },
    { label: "Gray", value: "#3f3f46" },
    { label: "Red", value: "#7f1d1d" },
    { label: "Orange", value: "#7c2d12" },
    { label: "Yellow", value: "#713f12" },
    { label: "Green", value: "#14532d" },
    { label: "Cyan", value: "#164e63" },
    { label: "Blue", value: "#1e3a8a" },
    { label: "Purple", value: "#4c1d95" },
    { label: "Pink", value: "#831843" },
];

const selectStyle: React.CSSProperties = {
    background: "#111",
    color: "white",
    border: "1px solid #444",
    borderRadius: 5,
    padding: "6px 8px",
    fontSize: 12,
    cursor: "pointer",
};

export const CommentNode = memo(
    ({ id, data, selected }: NodeProps<CommentNodeType>) => {
        const { setNodes, getNodes } = useReactFlow();

        const editable =
            selected &&
            getNodes().filter((node) => node.selected).length === 1;

        const updateData = (updates: Partial<CommentNodeData>) => {
            setNodes((nodes) =>
                nodes.map((node) =>
                    node.id === id
                        ? {
                            ...node,
                            data: {
                                ...node.data,
                                ...updates,
                            },
                        }
                        : node
                )
            );
        };

        const textareaRef = useRef<HTMLTextAreaElement>(null);

        useEffect(() => {
            if (!editable || !textareaRef.current) return;

            const el = textareaRef.current;

            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;

            el.style.width = "auto";
            el.style.width = `${el.scrollWidth}px`;
        }, [editable, data.fontSize, data.text]);

        const color = data.color ?? "#ffffff";
        const backgroundColor = data.backgroundColor ?? "transparent";

        return (
            <>
                {/* Floating formatting toolbar */}
                <NodeToolbar
                    isVisible={editable}
                    position={Position.Top}
                    align="end"
                    className="nodrag nopan nowheel"
                >
                    <div
                        className="nodrag nopan nowheel"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: 8,
                            background: "#1b1b1b",
                            border: "1px solid #444",
                            borderRadius: 8,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
                        }}
                    >
                        {/* Font size */}
                        <select
                            title="Font size"
                            value={data.fontSize ?? 16}
                            onChange={(e) =>
                                updateData({
                                    fontSize: Number(e.target.value),
                                })
                            }
                            style={selectStyle}
                        >
                            {[16,32, 48, 64, 96, 128,256].map(
                                (size) => (
                                    <option key={size} value={size}>
                                        {size}px
                                    </option>
                                )
                            )}
                        </select>

                        <ColorDropdown
                            title="Text color"
                            value={data.color}
                            options={TEXT_COLORS}
                            onChange={(color) => updateData({ color })}
                        />

                        <ColorDropdown
                            title="Background"
                            value={data.backgroundColor}
                            options={BACKGROUND_COLORS}
                            onChange={(backgroundColor) => updateData({ backgroundColor })}
                        />

                    
                    </div>
                </NodeToolbar>

                {/* Comment itself */}
                <div
                    style={{
                        display: "inline-block",
                        width: "max-content",
                        maxWidth: "none",
                        padding: 8,
                        background: backgroundColor,
                        border: selected
                            ? "1px dashed #4da3ff"
                            : "1px solid transparent",
                        borderRadius: 6,
                    }}
                >
                    {editable ? (
                        <textarea
                            ref={textareaRef}
                            className="nodrag nopan nowheel"
                            autoFocus
                            value={data.text ?? ""}
                            placeholder="Write a comment..."
                            rows={1}
                            onChange={(e) => {
                                updateData({ text: e.target.value });

                                e.currentTarget.style.height = "auto";
                                e.currentTarget.style.height =
                                    `${e.currentTarget.scrollHeight}px`;

                                e.currentTarget.style.width = "auto";
                                e.currentTarget.style.width =
                                    `${e.currentTarget.scrollWidth}px`;
                            }}
                            style={{
                                display: "block",
                                width: "max-content",
                                minWidth: 0,
                                maxWidth: "none",
                                resize: "none",
                                overflow: "hidden",
                                whiteSpace: "pre",
                                background: "transparent",
                                color,
                                fontSize: data.fontSize ?? 16,
                                lineHeight: 1.5,
                                border: "none",
                                outline: "none",
                                padding: 0,
                                fontFamily: "inherit",
                                boxSizing: "content-box",
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: "max-content",
                                maxWidth: "none",
                                color,
                                fontSize: data.fontSize ?? 16,
                                whiteSpace: "pre",
                                lineHeight: 1.5,
                            }}
                        >
                            {data.text || "Empty comment"}
                        </div>
                    )}
                </div>
            </>
        );
    }
);

CommentNode.displayName = "CommentNode";

export const CommentNodeDefinition: NodeDefinition<
    CommentNodeData,
    "commentNode",
    any
> = {
    type: "commentNode",
    icon: faComment,
    displayName: "Comment",

    component: CommentNode,

    defaultData: {
        text: "Write a comment...",
        fontSize: 96,
        color: "#ffffff",
        backgroundColor: "#3f3f46",
    },

    getNodeOutputData: ({ node }) => {
        return node.data.text;
    },
};



type ColorOption = {
    label: string;
    value: string;
};

type ColorDropdownProps = {
    title: string;
    value: string;
    options: ColorOption[];
    onChange: (value: string) => void;
};

function ColorDropdown({
    title,
    value,
    options,
    onChange,
}: ColorDropdownProps) {

    return (
        <Dropdown>
            <Dropdown.Toggle
                size="sm"
                variant="dark"
                className="d-flex align-items-center gap-2"
            >
                <span
                    style={{
                        width: 14,
                        height: 14,
                        backgroundColor: value,
                        border: "1px solid #888",
                        borderRadius: 3,
                        display: "inline-block",
                    }}
                />
                {title}
            </Dropdown.Toggle>

            <Dropdown.Menu>
                {options.map((option) => (
                    <Dropdown.Item
                        key={option.value}
                        active={option.value === value}
                        onClick={() => onChange(option.value)}
                        className="d-flex align-items-center gap-2"
                    >
                        <span
                            style={{
                                width: 16,
                                height: 16,
                                flexShrink: 0,
                                backgroundColor: option.value,
                                border: "1px solid #888",
                                borderRadius: 3,
                                display: "inline-block",
                            }}
                        />
                        {option.label}
                    </Dropdown.Item>
                ))}
            </Dropdown.Menu>
        </Dropdown>
    );
}