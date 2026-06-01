import React from "react";
import { observer } from "mobx-react-lite";
import TaskInfoCard from "./TaskInfoCard";
import { CollapsibleContainerAccordion } from "./Atomic/CollapsibleContainer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faListOl } from "@fortawesome/free-solid-svg-icons";
import type { TasksJson } from "../classes/Task";

interface Props {
  tasksJson: TasksJson;
}

const TaskContainer: React.FC<Props> = observer(({ tasksJson }) => {
  if (!tasksJson.tasks || tasksJson.tasks.length === 0) {
    return (
      <div className="mt-2 text-muted">
        No tasks
      </div>
    );
  }

  return (
    <CollapsibleContainerAccordion
      label={`Tasks (${tasksJson.tasks.length})`}
      defaultCollapsed={false}
      className="mt-2 mb-2"
      openColor="#513b59"
      closedColor="#3a2a36"
      header={
        <>
          {`Tasks (${tasksJson.tasks.length})`}
          <FontAwesomeIcon icon={faListOl} className="mx-2" style={{ color: '#ff6eff', }} />
        </>
      }
    >
      <div className="d-flex flex-column gap-0">
        {tasksJson.tasks.map((task) => (
          <TaskInfoCard key={task.id} task={task} />
        ))}
      </div>
    </CollapsibleContainerAccordion>
  );
});

export default TaskContainer;
