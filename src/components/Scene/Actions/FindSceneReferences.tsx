import { observer } from "mobx-react-lite";
import React from "react";
import SettingsButton from "../../Atomic/SettingsButton";
import { WorkflowOptionSelect, WorkflowTextField } from "../../WorkflowOptionSelect";
import { AllTextModels } from "../../../classes/AI_provider";
import LoadingSpinner from "../../Atomic/LoadingSpinner";
import EditableJsonTextField from "../../EditableJsonTextField";
import { Button } from "react-bootstrap";
import type { Scene } from "../../../classes/Scene";

interface Props {
  scene: Scene;
}

export const FindSceneReferencesButton: React.FC<Props> = observer(({ scene }) => {
  const wf_name = scene.workflows.generate_tags

  return <div>
    <SettingsButton
      className="mb-2"
      buttons={
        <>
          <button className="btn btn-sm btn-outline-success" onClick={async () => {
            scene.generateTags();
          }} >
            Generate Tags
          </button>

          {/* Model Selector */}
          <WorkflowOptionSelect
            workflowName={wf_name}
            optionName={"model"}
            values={AllTextModels}
          />
          {/* Loading Spinner */}
          <LoadingSpinner isLoading={scene.is_generating_tags} asButton />
        </>
      }
      content={
        <>
          <WorkflowTextField workflowName={wf_name} optionName={"prompt"} />
          <EditableJsonTextField localJson={scene.sceneJson} field={scene.fields.generated_tags_list} />
          <Button size="sm" onClick={() => { scene.addGeneratedTags() }}>Add Generated Tags</Button>
        </>
      }
    />
  </div>;
});