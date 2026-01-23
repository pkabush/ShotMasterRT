import { observer } from "mobx-react-lite";
import SimpleSelect from "./Atomic/SimpleSelect";
import { Project } from "../classes/Project";

type WorkflowOptionSelectProps = {
    workflowName: string;
    project: Project;
    optionName: string;
    label?: string;
    values: string[];
};

// Wrap the component with observer so it reacts to MobX state changes
export const WorkflowOptionSelect = observer(function WorkflowOptionSelect({
    workflowName,
    project,
    optionName,
    label,
    values,
}: WorkflowOptionSelectProps) {
    // Get the current value from the observable project workflow
    const value = project?.workflows?.[workflowName]?.[optionName];

    return (
        <SimpleSelect
            value={value}
            options={values}
            label={label}
            onChange={(val: string) => {
                project.updateWorkflow(workflowName, optionName, val);
            }}
        />
    );
});
