import React from "react";
import { observer } from "mobx-react-lite";
import { Shot } from "../classes/Shot";
import TaskInfoCard from "./TaskInfoCard";
import { CollapsibleContainerAccordion } from "./Atomic/CollapsibleContainer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faListOl } from "@fortawesome/free-solid-svg-icons";

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
    <CollapsibleContainerAccordion
      label={`Tasks (${shot.tasks.length})`}
      defaultCollapsed={false}
      className="mt-2 mb-2"
      openColor="#513b59"
      closedColor="#3a2a36"
      header={
        <>
          {`Tasks (${shot.tasks.length})`}
          <FontAwesomeIcon icon={faListOl} className="mx-2" style={{ color: '#ff6eff', }} />
        </>
      }
    >
      <div className="d-flex flex-column gap-0">
        {shot.tasks.map((task) => (
          <TaskInfoCard key={task.id} task={task} />
        ))}
      </div>
    </CollapsibleContainerAccordion>
  );
});

export default TaskContainer;
