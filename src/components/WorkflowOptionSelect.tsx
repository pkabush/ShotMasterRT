import { observer } from "mobx-react-lite";
import SimpleSelect from "./Atomic/SimpleSelect";
import { Project } from "../classes/Project";

type WorkflowOptionSelectProps = {
    workflowName: string;
    project: Project;
    optionName: string;
    label?: string;
    values: string[];
    defaultValue?: string;
};

// Wrap the component with observer so it reacts to MobX state changes
export const WorkflowOptionSelect = observer(function WorkflowOptionSelect({
    workflowName,
    project,
    optionName,
    label,
    values,
    defaultValue,
}: WorkflowOptionSelectProps) {
    // Get the current value from the observable project workflow
    const value = project?.workflows?.[workflowName]?.[optionName] ?? defaultValue;

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
