import React from "react";
import { observer } from "mobx-react-lite";
import { Shot } from "../classes/Shot";
import TaskInfoCard from "./TaskInfoCard";
import CollapsibleContainer from "./Atomic/CollapsibleContainer";

interface Props {
  shot: Shot;
}

const TaskContainer: React.FC<Props> = observer(({ shot }) => {
  if (!shot.tasks || shot.tasks.length === 0) {
    return (
      <div className="mt-2 text-muted">
        No tasks
      </div>
    );
  }

  return (
    <CollapsibleContainer
      label={`Tasks (${shot.tasks.length})`}
      defaultCollapsed={false}
      className="mt-2 mb-2"
    >
      <div className="d-flex flex-column gap-0">
        {shot.tasks.map((task) => (
          <TaskInfoCard key={task.id} task={task} />
        ))}
      </div>
    </CollapsibleContainer>
  );
});

export default TaskContainer;
