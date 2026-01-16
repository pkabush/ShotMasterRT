import SimpleSelect from "./Atomic/SimpleSelect";
import { Project } from "../classes/Project";

type WorkflowOptionSelectProps = {
    workflowName: string;
    project: Project;
    optionName: string;
    label?: string;
    values: string[];
};

export function WorkflowOptionSelect({
    workflowName,
    project,
    optionName,
    label,
    values,
}: WorkflowOptionSelectProps) {
    const value =
        project?.workflows?.[workflowName]?.[optionName];

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
}
