// ShotInfoCard.tsx
import React from 'react';
import { observer } from 'mobx-react-lite';
import { Badge } from 'react-bootstrap';
import { Shot } from '../../../classes/Shot';
import SimpleSelect from '../../Atomic/SimpleSelect';
import TabsContainer from '../../TabsContainer';
import { Google_GenerateImageNode } from '../../GoogleNodes/Google_GenerateImageNode';
import { MediaFolderGallery } from '../../MediaFolderGallery';
import { Kling_GenerateVideo } from '../../Kling/Kling_GenerateVideo';
import { Kling_MotionControl } from '../../Kling/Kling_MotionControl';
import { BytePlus_GenerateVideo } from '../../BytePlus/BP_generateVideo';
import TaskContainer from '../../TaskContainer';
import { Kling_LipSync } from '../../Kling/Kling_LipSync';
import PrevisV2 from './Actions/Previs/PrevisV2/PrevisV2_Component';
import { ShotContextMenuWrapper } from './ShotContextMenu';
import { Kling_GenerateVideoV4 } from '../../Kling/Kling_GenerateVideoV4';

interface Props {
  shot: Shot;
}

const ShotInfoCard: React.FC<Props> = observer(({ shot }) => {
  if (!shot.shotJson) return <div>Loading shot info...</div>;

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-0">

        <ShotContextMenuWrapper shot={shot} >

          <h3><Badge
            bg="secondary"
            onClick={() => { shot.log() }}
            style={{ userSelect: "none", cursor: "pointer" }}
          >
            {shot.name}
          </Badge></h3>

        </ShotContextMenuWrapper>

        <div className="d-flex gap-2">

          {/* Pick shot type - crude implementation, fix later */}
          {/* 
          <SimpleSelect
            value={shot.shotJson.getField("shot_type") || "shot_type"}
            options={["simple shot", "actor shot"]}
            onChange={(val) => { shot.shotJson?.updateField("shot_type", val) }}
          />
          */}

          {/* Pick shot type - crude implementation, fix later */}
          <SimpleSelect
            value={shot.shotJson.getField("shot_state") || Object.keys(Shot.shot_states)[0]}
            options={Object.keys(Shot.shot_states)}
            onChange={(val) => { shot.shotJson?.updateField("shot_state", val) }}
            colorMap={Shot.shot_states}
          />

          {/**
          <MultiStateToggle
            states={Shot.shot_states}
            value={shot.shotJson.data?.shot_state || Object.keys(Shot.shot_states)[0]}
            onChange={(newState) => { if (shot.shotJson) { shot.shotJson.updateField("shot_state", newState); } }}
          />           

          <SimpleButton onClick={() => {
            const zip_name =  `${shot.scene.project.name}_${shot.path.replaceAll("/","_")}.zip` ;
            console.log("Downloading ZIP", `${shot.scene.project.name}_${shot.path.replaceAll("/","_")}.zip` );
            shot.downloadAsZip(zip_name);
          }} label="Zip Shot" />

          <SimpleButton onClick={handleDelete} label="Delete Shot" className="btn-outline-danger" />
          */}



        </div>
      </div>

      <TabsContainer
        tabs={{
          Generate_Image:
            <div className="card mb-2">
              <div className="card-body">

                {/**<Google_StylizeImageNode shot={shot} />*/}
                <Google_GenerateImageNode shot={shot} />

                {/** 
                <EditableJsonTextField localJson={shot.shotJson} field="video_prompt" fitHeight />
                <EditableJsonTextField localJson={shot.shotJson} field="camera" fitHeight />
                <EditableJsonTextField localJson={shot.shotJson} field="action_description" fitHeight />
                <TagsToggleList shot={shot} />
                */}

                <h5 className="me-4">Results</h5>
                <MediaFolderGallery mediaFolder={shot.MediaFolder_results}></MediaFolderGallery>

              </div>
            </div>
          ,
          Seedance_Video: <>

            <BytePlus_GenerateVideo shot={shot} />

            <TaskContainer tasksJson={shot.tasksJson!} />
            <MediaFolderGallery mediaFolder={shot.MediaFolder_genVideo} />

          </>
          ,
          Kling_Video: <>
            <Kling_GenerateVideoV4 shot={shot} />
            <Kling_GenerateVideo shot={shot} />
            <Kling_MotionControl shot={shot} />

            <TaskContainer tasksJson={shot.tasksJson!} />
            <MediaFolderGallery mediaFolder={shot.MediaFolder_genVideo} />

          </>
          ,
          Kling_LipSync: <>
            <Kling_LipSync shot={shot} />
            <TaskContainer tasksJson={shot.tasksJson!} />
          </>
          ,

          "Output": <>
            <MediaFolderGallery mediaFolder={shot.MediaFolder_genVideo} />
            <MediaFolderGallery mediaFolder={shot.MediaFolder_results} />
            <MediaFolderGallery mediaFolder={shot.MediaFolder_refVideo} />
          </>,


          /**
          "StoryCrush": <>
            <EditableJsonTextField localJson={shot.shotJson} field="description" fitHeight />

            <TagsFolderContainer tags={shot.references} folders={[Project.getProject(), Project.getProject().artbook as LocalFolder]} />

            {false && <ShotFindReferencesButton shot={shot} />}
            <ShotGenerateMissingReferencesButton shot={shot} />
            <ShotGenerateShotlist shot={shot} />
            <WF_ShotGenerateStagingImage.component shot={shot} />
            <ShotAddFramesFromPrevious shot={shot} />

            <ShotAskGenerationDuration shot={shot} />

            <ShotGenerateVideoPrompt shot={shot} />

            <br />
            <br />
            <h3>Video Generation:</h3>

            <BytePlus_GenerateVideo shot={shot} />
            <TaskContainer tasksJson={shot.tasksJson!} />
            <MediaFolderGallery mediaFolder={shot.MediaFolder_genVideo} defaultCollapsed={true} />
          </>,
           */

          "PrevisUtil_V2": <PrevisV2 shot={shot} />
        }}
      />


    </>
  );
});

export default ShotInfoCard;





