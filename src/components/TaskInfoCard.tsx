import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { Task } from "../classes/Task";
import SimpleButton from "./Atomic/SimpleButton";
import LoadingSpinner from "./Atomic/LoadingSpinner";
import { MediaPreviewSmall } from "./MediaComponents/MediaPreviewSmall";
import * as ContextMenu from "@radix-ui/react-context-menu";
import { MenuItemIcon } from "./MediaFolderGallery";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboard, faTrashCan } from "@fortawesome/free-solid-svg-icons";

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

const TaskInfoCard: React.FC<Props> = observer(({ task, show_path = false }) => {
    const status = task.status;
    const color = statusColors[status] ?? "gray";

    const onDelete = useCallback(() => {
        if (window.confirm(`Delete task ${task.id}?`)) {
            task.delete();
        }
    }, [task])

    return (
        <ContextMenu.Root>
            <ContextMenu.Trigger>

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

                            {show_path && (
                                <span
                                    className="text-muted"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => { task.navigate(); }}
                                >
                                    {task.tasksJson.dataJson?.parentFolder!.path!}/
                                </span>
                            )}

                            <span className="fw-bold">{task.id}</span>
                            <span className="text-muted">{status}</span>


                            {/**RESULTS PREVIEW */}
                            {task.result && (
                                <MediaPreviewSmall media={task.result} />
                            )}

                        </div>

                        {/* Right side: buttons */}
                        <div className="d-flex gap-0">

                            <span className="text-muted me-2">{task._status_log}</span>

                            <SimpleButton
                                label="Check Status"
                                className="btn-outline-primary btn-sm rounded-0"
                                onClick={() => { task.check_status() }}
                            />

                            <LoadingSpinner isLoading={task.is_checking_status} asButton />
                        </div>

                    </div>
                </div>
            </ContextMenu.Trigger>

            <ContextMenu.Portal>
                <ContextMenu.Content className="ContextMenuContent">

                    {task.result && (
                        <ContextMenu.Item className="ContextMenuItem warning" onClick={() => {task.result?.copyToClipboard()}}>
                            <MenuItemIcon><FontAwesomeIcon icon={faClipboard} /></MenuItemIcon>
                            Copy
                        </ContextMenu.Item>
                    )}

                    <ContextMenu.Item className="ContextMenuItem" onClick={() => task.log()}>
                        <MenuItemIcon><FontAwesomeIcon icon={faClipboard} /></MenuItemIcon>
                        Log
                    </ContextMenu.Item>

                    <ContextMenu.Item className="ContextMenuItem danger" onClick={onDelete}>
                        <MenuItemIcon><FontAwesomeIcon icon={faTrashCan} /></MenuItemIcon>
                        Delete
                    </ContextMenu.Item>

                </ContextMenu.Content>
            </ContextMenu.Portal>

        </ContextMenu.Root>
    );
});

export default TaskInfoCard;
