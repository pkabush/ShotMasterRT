import { observer } from "mobx-react-lite";
import SimpleSelect from "./Atomic/SimpleSelect";
import { Project, type Workflow } from "../classes/Project";
import EditableJsonTextField from "./EditableJsonTextField";

type WorkflowOptionSelectProps = {
    workflowName: string;
    project?: Project;
    optionName: keyof Workflow;
    label?: string;
    values: string[];
    defaultValue?: string;
};

// Wrap the component with observer so it reacts to MobX state changes
export const WorkflowOptionSelect = observer(function WorkflowOptionSelect({
    workflowName,
    project = Project.getProject(),
    optionName,
    label,
    values,
    defaultValue,
}: WorkflowOptionSelectProps) {
    // Get the current value from the observable project workflow
    const value = Project.getProject().workflows[workflowName]?.[optionName] ?? defaultValue;  
   
    return (
        <SimpleSelect
            value={value ?? values[0]}
            options={values}
            label={label}
            onChange={(val: string) => {
                project.updateWorkflow(workflowName, optionName, val);
            }}
        />
    );
});


type WorkflowTextFieldProps = {
    workflowName: string;
    optionName: keyof Workflow;
};

export const WorkflowTextField = observer(function WorkflowOptionSelect({
    workflowName,
    optionName,
}: WorkflowTextFieldProps) {

    return (
        <EditableJsonTextField
            localJson={Project.getProject().projinfo}
            field={`workflows/${workflowName}/${optionName}`}
            fitHeight />
    );
});



