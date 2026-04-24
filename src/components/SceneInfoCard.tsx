import React from "react";
import { observer } from "mobx-react-lite"; // <--- important
import { Scene } from "../classes/Scene";
import EditableJsonTextField from "./EditableJsonTextField";
import SimpleSelect from "./Atomic/SimpleSelect";
import LoadingSpinner from "./Atomic/LoadingSpinner";
import { models } from "../classes/ChatGPT";
import SettingsButton from "./Atomic/SettingsButton";
import { TagsFolderContainer } from "./FolderTags/FolderTagsContainer";
import type { LocalFolder } from "../classes/fileSystem/LocalFolder";
import { WorkflowOptionSelect, WorkflowTextField } from "./WorkflowOptionSelect";
import { AllTextModels } from "../classes/AI_provider";
import { Button } from "react-bootstrap";
import { CollapsibleContainerAccordion } from "./Atomic/CollapsibleContainer";

interface Props {
  scene: Scene;
}

const SceneInfoCard: React.FC<Props> = observer(({ scene }) => { // <--- observer
  if (!scene.sceneJson) {
    return <div>No scene data available.</div>;
  }

  const handleCreateShots = async () => {
    scene.createShotsFromShotsJson();
  };

  return (
    <div>
      {/** GENERATE SHOTS JSON */}
      <SettingsButton className="mb-2"
        buttons={
          <>
            {/**Button */}
            <button className="btn btn-sm btn-outline-success" onClick={async () => {
              const res = await scene.generateShotsJson()
              scene.sceneJson?.updateField("shotsjson", res);
            }}> Split Into Shots </button>
            {/**Model Selector */}
            <SimpleSelect
              value={scene.project.workflows.split_scene_into_shots.model ?? models[0]}
              options={models}
              onChange={(val) => { scene.project.updateWorkflow("split_scene_into_shots", "model", val); }}
            />
            {/**Loading Spinner */}
            <LoadingSpinner isLoading={scene.is_generating_shotsjson} asButton />
          </>
        }
        content={
          <>
            <Button onClick={handleCreateShots} size="sm" className="mb-2">Create Shots From Json</Button>
            <CollapsibleContainerAccordion label="Prompt" defaultCollapsed={true}>
              <div className="p-2">

                <EditableJsonTextField localJson={scene.project.projinfo} field="workflows/split_scene_into_shots/system_message" fitHeight collapsed={true}/>
                <EditableJsonTextField localJson={scene.project.projinfo} field="workflows/split_scene_into_shots/prompt" fitHeight collapsed={true}/>
                <EditableJsonTextField localJson={scene.sceneJson} field="split_prompt" fitHeight />
              </div>
            </CollapsibleContainerAccordion>
            <EditableJsonTextField localJson={scene.sceneJson} field="shotsjson" fitHeight collapsed={true}/>
          </>
        }
      />

      <GenTagsButton scene={scene} />

      <EditableJsonTextField localJson={scene.sceneJson} field="script" fitHeight collapsed={true}/>

      <TagsFolderContainer tags={scene.references} folders={[scene.project, scene.project.artbook as LocalFolder, scene]} />

      <div style={{ height: "500px" }}></div>
    </div>
  );
});

export default SceneInfoCard;

export const GenTagsButton: React.FC<Props> = observer(({ scene }) => {
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