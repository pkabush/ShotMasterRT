import { memo } from "react";
import {
  useReactFlow,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { NamedInputHandle, NamedOutputHandle } from "../Atomic/NamedInput";

export type TextNodeData = {
  text: string;
};

export type TextNodeType = Node<TextNodeData, "textNode">;


export const TextNode = memo(
  ({ id, data, selected }: NodeProps<TextNodeType>) => {
    const { setNodes } = useReactFlow();

    return (
      <div
        style={{
          background: "#111",
          color: "white",
          border: selected ? "2px solid #4da3ff" : "1px solid #333",
          borderRadius: 12,
          padding: 12,
          minWidth: 240,
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
          Text Node
        </div>

        <textarea
          className="nodrag nopan nowheel"
          value={data.text ?? ""}
          placeholder="Enter text..."
          rows={5}
          style={{
            width: "100%",
            resize: "both",
            background: "#0c0c0c",
            color: "white",
            border: "1px solid #444",
            borderRadius: 6,
            padding: 8,
            outline: "none",
            fontFamily: "inherit",
            fontSize: 14,
            boxSizing: "border-box",
          }}



          onChange={(e) => {
            const value = e.target.value;

            setNodes((nds) =>
              nds.map((n) =>
                n.id === id ? {
                  ...n, data: {
                    ...n.data,
                    text: value,
                  },
                }
                  : n
              )
            );
          }}
        />

        <NamedOutputHandle id="out_text" />
        <NamedInputHandle id={`input_0`} />

      </div>
    );
  }
);

TextNode.displayName = "TextNode";