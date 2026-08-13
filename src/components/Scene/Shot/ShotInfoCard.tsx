// ShotInfoCard.tsx
import React from 'react';
import { observer } from 'mobx-react-lite';
import { Badge, Button } from 'react-bootstrap';
import { toJS } from 'mobx';
import { Shot } from '../../../classes/Shot';
import SimpleSelect from '../../Atomic/SimpleSelect';
import MultiStateToggle from '../../Atomic/MultiStateToggle';
import SimpleButton from '../../Atomic/SimpleButton';
import TabsContainer from '../../TabsContainer';
import { Google_StylizeImageNode } from '../../GoogleNodes/Google_StylizeImageNode';
import { Google_GenerateImageNode } from '../../GoogleNodes/Google_GenerateImageNode';
import { MediaFolderGallery } from '../../MediaFolderGallery';
import EditableJsonTextField, { EditableJsonToggleField } from '../../EditableJsonTextField';
import { Kling_GenerateVideo } from '../../Kling/Kling_GenerateVideo';
import { Kling_MotionControl } from '../../Kling/Kling_MotionControl';
import { Google_GenerateKlingPrompt } from '../../GoogleNodes/Google_GenerateKlingPrompt';
import { BytePlus_GenerateVideo } from '../../BytePlus/BP_generateVideo';
import TaskContainer from '../../TaskContainer';
import { Kling_LipSync } from '../../Kling/Kling_LipSync';
import { TagsFolderContainer } from '../../FolderTags/FolderTagsContainer';
import { Project } from '../../../classes/Project';
import type { LocalFolder } from '../../../classes/fileSystem/LocalFolder';
import SettingsButton from '../../Atomic/SettingsButton';
import { WorkflowOptionSelect, WorkflowTextField } from '../../WorkflowOptionSelect';
import { AI, AllTextModels } from '../../../classes/AI_provider';


interface Props {
  shot: Shot;
}

const ShotInfoCard: React.FC<Props> = observer(({ shot }) => {
  if (!shot.shotJson) return <div>Loading shot info...</div>;

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete shot "${shot.name}"?`)) {
      await shot.delete();
    }
  };

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-0">
        <h3><Badge bg="secondary">{shot.name}</Badge></h3>
        <div className="d-flex gap-2">

          {/* Pick shot type - crude implementation, fix later */}
          <SimpleSelect
            value={shot.shotJson.getField("shot_type") || "shot_type"}
            options={["simple shot", "actor shot"]}
            onChange={(val) => { shot.shotJson?.updateField("shot_type", val) }}
          />

          {/* Pick shot type - crude implementation, fix later */}
          <SimpleSelect
            value={shot.shotJson.getField("shot_state") || Object.keys(Shot.shot_states)[0]}
            options={Object.keys(Shot.shot_states)}
            onChange={(val) => { shot.shotJson?.updateField("shot_state", val) }}
            colorMap={Shot.shot_states}
          />

          {/**
          <SimpleToggle
            label="Finished Image"
            value={!!shot.shotJson.data?.finished_image} // <-- controlled from JSON
            onToggle={(state) => {
              if (shot.shotJson) {
                shot.shotJson.updateField('finished_image', state);
              }
            }}
            activeColor='#848000'
          />

          <SimpleToggle
            label="Finished"
            value={!!shot.shotJson.data?.finished} // <-- controlled from JSON
            onToggle={(state) => {
              if (shot.shotJson) {
                shot.shotJson.updateField('finished', state);
                if(state) shot.shotJson.updateField('finished_image', state);
              }
            }}
          />
           */}

          <MultiStateToggle
            states={Shot.shot_states}
            value={shot.shotJson.data?.shot_state || Object.keys(Shot.shot_states)[0]}
            onChange={(newState) => { if (shot.shotJson) { shot.shotJson.updateField("shot_state", newState); } }}
          />

          <SimpleButton onClick={() => { shot.log() }} label="Log Shot" />

          <SimpleButton onClick={() => {
            console.log("tasks",
              toJS(shot.tasksJson?.tasks)
            );

          }} label="New Tasks" />
          <SimpleButton onClick={handleDelete} label="Delete Shot" className="btn-outline-danger" />
        </div>
      </div>

      <TabsContainer
        tabs={{
          Generate_Image:
            <div className="card mb-2">
              <div className="card-body">


                <Google_StylizeImageNode shot={shot} />
                <Google_GenerateImageNode shot={shot} />


                {/** 
                <EditableJsonTextField localJson={shot.shotJson} field="video_prompt" fitHeight />
                <EditableJsonTextField localJson={shot.shotJson} field="camera" fitHeight />
                <EditableJsonTextField localJson={shot.shotJson} field="action_description" fitHeight />
                <TagsToggleList shot={shot} />
                */}

                <MediaFolderGallery mediaFolder={shot.MediaFolder_results}></MediaFolderGallery>

              </div>
            </div>



          ,
          Generate_VIDEO: <>
            <EditableJsonToggleField localJson={shot.scene.project.projinfo} field={"auto_load_first_frame"} default_val={false} label="Auto Load First Frame" />

            <Kling_GenerateVideo shot={shot} />
            <Kling_MotionControl shot={shot} />
            {false && <Google_GenerateKlingPrompt shot={shot} />}
            <BytePlus_GenerateVideo shot={shot} />

            <TaskContainer tasksJson={shot.tasksJson!} />
            <MediaFolderGallery mediaFolder={shot.MediaFolder_genVideo} />
          </>
          ,
          LipSync: <>
            <Kling_LipSync shot={shot} />
            <TaskContainer tasksJson={shot.tasksJson!} />
          </>
          ,

          "Output": <>
            <MediaFolderGallery mediaFolder={shot.MediaFolder_genVideo} />
            <MediaFolderGallery mediaFolder={shot.MediaFolder_results} />
            <MediaFolderGallery mediaFolder={shot.MediaFolder_refVideo} />
          </>,

          "StoryCrush": <>
            <EditableJsonTextField localJson={shot.shotJson} field="description" fitHeight />

            <SC_GenTagsButton shot={shot} />
            <SC_FindRefsToGenerate shot={shot} />
            <TagsFolderContainer tags={shot.references} folders={[Project.getProject(), Project.getProject().artbook as LocalFolder]} />


          </>

        }}
      />


    </>
  );
});

export default ShotInfoCard;




export const SC_GenTagsButton: React.FC<Props> = observer(({ shot }) => {
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


export const SC_FindRefsToGenerate: React.FC<Props> = observer(({ shot }) => {
  const wf_name = "sc_find_refs_to_generate"
  const output = "sc_find_refs_to_generate_output"

  return <div>
    <SettingsButton
      className="mb-2"
      buttons={
        <>
          <button className="btn btn-sm btn-outline-success" onClick={async () => {
            const workflow = shot.scene.project.workflows[wf_name]            

            const prompt = `
${workflow.prompt ?? ""}

Desctiption:
${shot.shotJson?.data.description}


Paths to references I Already have:
${ shot.references?.get_active_tags.join("\n") }

`;

            
            const res = await AI.GenerateText({
              prompt: prompt,
              model: workflow.model ?? AllTextModels[0],
            })
            shot.shotJson!.updateField(output, res);            

          }} >
            Generate Missing References
          </button>

          {/* Model Selector */}
          <WorkflowOptionSelect
            workflowName={wf_name}
            optionName={"model"}
            values={AllTextModels}
          />
          {/* Loading Spinner */}
          {/*<LoadingSpinner isLoading={shot.is_generating_tags} asButton /> */}


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