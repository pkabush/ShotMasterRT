import React from "react";
import { observer } from "mobx-react-lite";
import TaskInfoCard from "./TaskInfoCard";
import CollapsibleContainer from "./Atomic/CollapsibleContainer";
import type { Project } from "../classes/Project";
import SimpleButton from "./Atomic/SimpleButton";

interface Props {
    project: Project;
}

const TaskView: React.FC<Props> = observer(({ project }) => {
    // Flatten all tasks from all shots in all scenes
    const allTasks = project.scenes.flatMap(scene =>
        scene.shots.flatMap(shot =>
            shot.tasks.map(task => (task))
        )
    );

    return (
        <>
            <h3>TASK VIEW</h3>

            <SimpleButton label={"Delete Failed"} onClick={() => { 
                for (const task of allTasks) { if (task.status == "failed") task.delete(); }
                }}></SimpleButton>
            <SimpleButton label={"Delete Succeed"} onClick={() => {
                for (const task of allTasks) { if (task.status == "succeed") task.delete(); }
            }}></SimpleButton>
            <SimpleButton label={"Check ALL Submitted"} onClick={() => {
                for (const task of allTasks) { if (task.status == "submitted" || task.status == "processing") task.check_status(); }
            }}></SimpleButton>



            <CollapsibleContainer
                label={`Tasks (${allTasks.length})`}
                defaultCollapsed={false}
                className="mt-2 mb-2"
            >
                <div className="d-flex flex-column gap-0">
                    {allTasks.map((task) => (
                        <TaskInfoCard key={task.id} task={task} show_path={true}/>
                    ))}
                </div>
            </CollapsibleContainer>
        </>
    );
});

export default TaskView;
