import { memo, useState } from "react";
import { useNodes, type Node, type NodeProps } from "@xyflow/react";

import LoadingSpinner from "../../Atomic/LoadingSpinner";
import { Project } from "../../../classes/Project";

import { NamedInputHandle } from "../Atomic/NamedInput";
import { useNodeGraphApi } from "../nodeGraphApi";
import { Shot } from "../../../classes/Shot";
import TaskContainer from "../../TaskContainer";
import { useLocalFile } from "../Context/LocalFileContext";



export type ShotTasksModelData = {

};

export type ShotTasksModelType = Node<ShotTasksModelData, "tasksModel">;

export const ShotTasksNode = memo(
    //@ts-ignore
    ({ id, data, selected }: NodeProps<ShotTasksModelType>) => {
        //@ts-ignore
        const [loading, setLoading] = useState(false);
        //@ts-ignore
        const nodes = useNodes();
        const nodegraph_api = useNodeGraphApi();

        const in0 = nodegraph_api.getInputNodes(id, "path")[0];
        //console.log(in0.data.path);

        const project = Project.getProject();

        const shot = project.getByAbsPath(in0?.data?.path as string);
        const is_shot = shot instanceof Shot;

        const { tasks_json } = useLocalFile();


        return (
            <>
                <div
                    style={{
                        background: "#111",
                        color: "white",
                        border: selected ? "2px solid #4da3ff" : "1px solid #333",
                        borderRadius: 12,
                        padding: 12,
                        minWidth: 440,
                        position: "relative",
                        boxShadow: loading
                            ? "0 0 12px 2px rgba(0, 255, 100, 0.7)"
                            : "none",
                    }}
                >

                    <div style={{ fontSize: 12, marginBottom: 8, opacity: 0.7 }}>
                        Shot Tasks
                    </div>

                    <div className="nodrag">
                        <div style={{
                            position: "absolute",
                            top: 10,
                            right: 15,
                        }}>
                            <LoadingSpinner isLoading={loading} />
                        </div>

                        {in0?.data?.path as string}
                        {is_shot && <TaskContainer tasksJson={shot.tasksJson!} />}
                        {!is_shot && <TaskContainer tasksJson={tasks_json} />}


                    </div>

                    <NamedInputHandle id={"path"} index={0} />
                </div >
            </>
        );
    }
);

ShotTasksNode.displayName = "ButtonNode";



