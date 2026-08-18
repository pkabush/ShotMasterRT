import { observer } from "mobx-react-lite";
import React from "react";
import SettingsButton from "../../Atomic/SettingsButton";
import { WorkflowOptionSelect, WorkflowTextField } from "../../WorkflowOptionSelect";
import { AI, AllTextModels } from "../../../classes/AI_provider";
import LoadingSpinner from "../../Atomic/LoadingSpinner";
import EditableJsonTextField from "../../EditableJsonTextField";
import { Button } from "react-bootstrap";
import type { Scene } from "../../../classes/Scene";
import { runInAction } from "mobx";

interface Props {
  scene: Scene;
}

const wf_name = "generate_tags_for_scene";
const wf_output = `${wf_name}/output`;

export const FindSceneReferencesButton: React.FC<Props> = observer(({ scene }) => {

  const existingTags = findExistingTags(scene);

  return <div>
    <SettingsButton
      className="mb-2"
      buttons={
        <>
          <button className="btn btn-sm btn-outline-success" onClick={async () => { generateTags(scene); }} >
            Find Refs in Artbook
          </button>

          {/* Model Selector */}
          <WorkflowOptionSelect
            workflowName={wf_name}
            optionName={"model"}
            values={AllTextModels}
          />
          {/* Loading Spinner */}
          <LoadingSpinner isLoading={scene.is_generating_tags} asButton />

          <Button size="sm" variant={existingTags ? "success" : "outline-secondary"}>
            Refs: {Object.keys(existingTags ?? {}).length}
          </Button>

          <Button size="sm" variant="outline-primary" onClick={() => { addGeneratedTags(scene) }}>Add Found Refs</Button>
        </>
      }
      content={
        <>
          <WorkflowTextField workflowName={wf_name} optionName={"prompt"} />
          <EditableJsonTextField localJson={scene.sceneJson} field={wf_output} />
        </>
      }
    />
  </div>;
});


async function generateTags(scene: Scene) {
  runInAction(() => { scene.is_generating_tags = true; });
  const workflow = scene.project.workflows[wf_name]

  const prompt = `
${workflow.prompt ?? ""}

SCRIPT:
${scene.sceneJson?.data.script}

SHOTS JSON:
${scene.sceneJson?.data.shotsjson}

REFS DICTIONARY:
${scene.project.artbook?.tags_list.join("\n")}

`;

  const res = await AI.GenerateText({
    prompt: prompt,
    model: workflow.model!,
  })

  await scene.sceneJson?.updateField(wf_output, res);

  await addGeneratedTags(scene);
  runInAction(() => { scene.is_generating_tags = false; });
}

export function findExistingTags(scene: Scene): string[] {
  const generatedTags = scene.sceneJson?.getField(wf_output);

  if (!generatedTags || typeof generatedTags !== "string") {
    return [];
  }

  return generatedTags
    .split("\n")
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
    .filter(tag => {
      const exists = scene.getByAbsPath(tag);

      if (!exists) {
        console.log("MISSING TAG:", tag);
      }

      return !!exists;
    });
}


async function addGeneratedTags(scene: Scene) {
  const existingTags = findExistingTags(scene);

  for (const tag of existingTags) {
    scene.references?.addTag(tag);
  }
}