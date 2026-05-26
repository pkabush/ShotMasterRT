import { memo, useEffect, useState } from "react";
import { useReactFlow, useStore, useUpdateNodeInternals, type Node, type NodeProps } from "@xyflow/react";
import {  Button, Stack } from "react-bootstrap";
import SimpleSelect from "../../Atomic/SimpleSelect";
import { GoogleAI, type AIMessage } from "../../../classes/GoogleAI";
import LoadingSpinner from "../../Atomic/LoadingSpinner";
import { Project } from "../../../classes/Project";
import { LocalImage } from "../../../classes/fileSystem/LocalImage";
import { NamedInputHandle, NamedOutputHandle } from "../Atomic/NamedInput";
import { useLocalFile } from "../Context/LocalFileContext";
import { useNodeGraphApi } from "../nodeGraphApi";

export type TasksModelData = {

};

export type TasksModelType = Node<TasksModelData, "tasksModel">;

export const TasksNode = memo(
    ({ id, data, selected }: NodeProps<TasksModelType>) => {
        const [loading, setLoading] = useState(false);

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
                    boxShadow: loading
                        ? "0 0 12px 2px rgba(0, 255, 100, 0.7)"
                        : "none",
                }}
            >

                <div style={{ fontSize: 12, marginBottom: 8, opacity: 0.7 }}>
                    Google AI
                </div>

                <div className="nodrag">
                    <div style={{
                        position: "absolute",
                        top: 10,
                        right: 15,
                    }}>
                        <LoadingSpinner isLoading={loading} />
                    </div>


                    

                </div>


            </div >
        );
    }
);

TasksNode.displayName = "ButtonNode";



