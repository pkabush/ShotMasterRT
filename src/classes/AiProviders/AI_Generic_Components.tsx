
import React from "react";
import { Project } from "../../classes/Project";
import { WorkflowOptionSelect } from "../../components/WorkflowOptionSelect";
import { AllImageModels, AllTextModels } from "./AI_Generic";

interface WorkflowModelSelectProps {
    workflowName: string;
    models: string[];
}

export const WorkflowModelSelect: React.FC<WorkflowModelSelectProps> = ({
    workflowName,
    models,
}) => {
    const project = Project.getProject();

    return (
        <WorkflowOptionSelect
            project={project}
            workflowName={workflowName}
            optionName="model"
            values={models}
        />
    );
};

export const WorkflowImageModelSelect: React.FC<{ workflowName: string }> = ({
    workflowName,
}) => {
    return (
        <WorkflowModelSelect
            workflowName={workflowName}
            models={[...AllImageModels]}
        />
    );
};

export const WorkflowTextModelSelect: React.FC<{ workflowName: string }> = ({
    workflowName,
}) => {
    return (
        <WorkflowModelSelect
            workflowName={workflowName}
            models={[...AllTextModels]}
        />
    );
};