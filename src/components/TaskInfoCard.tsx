import React from "react";
import { observer } from "mobx-react-lite";
import { Task } from "../classes/Task";
import SimpleButton from "./Atomic/SimpleButton";
import LoadingSpinner from "./Atomic/LoadingSpinner";

interface Props {
    task: Task;
    show_path?: boolean;
}

const statusColors: Record<string, string> = {
    submitted: "gray",
    processing: "orange",
    succeed: "green",
    failed: "red",
};

const TaskInfoCard: React.FC<Props> = observer(({ task , show_path=false }) => {
    const status = task.status;
    const color = statusColors[status] ?? "gray";

    return (
        <div className="card mb-0">
            <div className="card-body d-flex align-items-center justify-content-between py-0">
                {/* Left side: circle + id + status */}
                <div className="d-flex align-items-center gap-2">
                    <div
                        style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            backgroundColor: color,
                        }}
                    />
                    {show_path && <span className="text-muted">{task.shot.scene.folder.name +"/"+ task.shot.folder.name  + "/"}</span>}
                    <span className="fw-bold">{task.id}</span>
                    <span className="text-muted">{status}</span>
                </div>

                {/* Right side: buttons */}
                <div className="d-flex gap-0">

                    <span className="text-muted me-2">{task._status_log}</span>

                    <SimpleButton
                        label="Check Status"
                        className="btn-outline-primary btn-sm rounded-0"
                        onClick={() => { task.check_status()}}
                    />

                    <SimpleButton
                        label="Delete"
                        className="btn-outline-danger btn-sm rounded-0"
                        onClick={() => {
                            if (window.confirm(`Delete task ${task.id}?`)) {
                                task.delete();
                            }
                        }}
                    />

                    <SimpleButton
                        label="Log"
                        className="btn-outline-secondary btn-sm rounded-0"
                        onClick={() => {
                            task.log();
                        }}
                    />
                    <LoadingSpinner isLoading={task.is_checking_status} asButton />
                </div>

            </div>
        </div>
    );
});

export default TaskInfoCard;
