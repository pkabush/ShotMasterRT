import { Handle, Position } from "@xyflow/react";


type NamedHandleProps = {
    id: string;
    index?: number;
    type: "source" | "target";
    active?: boolean;
};

export const NamedHandle = ({
    id,
    index = 0,
    type,
    active = true,
}: NamedHandleProps) => {
    const spacing = 20;

    const position = type === "target" ? Position.Left : Position.Right;
    const isLeft = type === "target";

    return (
        <>
            <Handle
                type={type}
                position={position}
                id={id}
                style={{
                    background: active ? "#fff" : "#666",
                    border: active ? "1px solid #fff" : "1px solid #444",
                    width: 10,
                    height: 10,
                    top: 15 + index * spacing,
                    ...(isLeft ? { left: -5 } : { right: -5 }),
                }}
            />

            <div
                style={{
                    position: "absolute",
                    top: 8 + index * spacing,
                    fontSize: 11,
                    opacity: active ? 0.7 : 0.35,
                    color: "#fff",
                    pointerEvents: "none",
                    userSelect: "none",

                    width: 80, // key: reserve space
                    whiteSpace: "nowrap",

                    ...(isLeft
                        ? {
                            left: -90,
                            textAlign: "right",
                            transform: "translateX(-4px)",
                        }
                        : {
                            right: -90,
                            textAlign: "left",
                            transform: "translateX(6px)",
                        }),
                }}
            >
                {id}
            </div>
        </>
    );
};

export const NamedInputHandle = (props: Omit<NamedHandleProps, "type">) => {
    return <NamedHandle {...props} type="target" />;
};

export const NamedOutputHandle = (props: Omit<NamedHandleProps, "type">) => {
    return <NamedHandle {...props} type="source" />;
};