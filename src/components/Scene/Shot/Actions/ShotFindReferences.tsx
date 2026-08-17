import { observer } from "mobx-react-lite";
import type { Shot } from "../../../../classes/Shot";
import SettingsButton from "../../../Atomic/SettingsButton";
import { AI, AllTextModels } from "../../../../classes/AI_provider";
import { WorkflowOptionSelect, WorkflowTextField } from "../../../WorkflowOptionSelect";
import { Button } from "react-bootstrap";
import EditableJsonTextField from "../../../EditableJsonTextField";


interface Props {
  shot: Shot;
}


export const ShotFindReferencesButton: React.FC<Props> = observer(({ shot }) => {
  const wf_name = "find_shot_refs_from_description"
  const output = "find_shot_refs_from_description_output"

  return <div>
    <SettingsButton
      className="mb-2"
      buttons={
        <>
          <button className="btn btn-sm btn-outline-success" onClick={async () => {
            console.log("FIND REFS")

            const workflow = shot.scene.project.workflows[wf_name]

            const prompt = `
${workflow.prompt ?? ""}

Desctiption:
${shot.shotJson?.data.description}


REFS DICTIONARY:
${shot.scene.project.artbook?.tags_list.join("\n")}

`;
            const res = await AI.GenerateText({
              prompt: prompt,
              model: workflow.model ?? AllTextModels[0],
            })
            shot.shotJson!.updateField(output, res);
            shot.references?.addTagsListFromText(shot.shotJson?.getField(output));
          }} >
            Find References
          </button>

          {/* Model Selector */}
          <WorkflowOptionSelect
            workflowName={wf_name}
            optionName={"model"}
            values={AllTextModels}
          />
          {/* Loading Spinner */}
          {/*<LoadingSpinner isLoading={shot.is_generating_tags} asButton /> */}

          <Button size='sm' onClick={() => {
            shot.references?.addTagsListFromText(shot.shotJson?.getField(output));
          }}>Add Refs</Button>

        </>
      }
      content={
        <>
          <WorkflowTextField workflowName={wf_name} optionName={"prompt"} />
          <EditableJsonTextField localJson={shot.shotJson} field={output} />
        </>
      }
    />
  </div>;
});