// ShotInfoCard.tsx
import React from 'react';
import { observer } from 'mobx-react-lite';
import { Shot } from '../classes/Shot';
import SimpleButton from './Atomic/SimpleButton';
import SimpleToggle from './SimpleToggle';
import SimpleSelect from './Atomic/SimpleSelect';
import TaskContainer from './TaskContainer';
import TabsContainer from './TabsContainer';
import { MediaFolderGallery } from './MediaFolderGallery';
import { Kling_GenerateVideo } from './Kling/Kling_GenerateVideo';
import { Kling_MotionControl } from './Kling/Kling_MotionControl';
import { Google_StylizeImageNode } from './GoogleNodes/Google_StylizeImageNode';
import { Google_GenerateImageNode } from './GoogleNodes/Google_GenerateImageNode';
import { Kling_LipSync } from './Kling/Kling_LipSync';

interface Props {
  shot: Shot;
}

const ShotInfoCard: React.FC<Props> = observer(({ shot }) => {
  if (!shot.shotJson) return <div>Loading shot info...</div>;

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete shot "${shot.folder.name}"?`)) {
      await shot.delete();
    }
  };

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-0">
        <strong>{shot.folder.name}</strong>
        <div className="d-flex gap-2">

          {/* Pick shot type - crude implementation, fix later */}
          <SimpleSelect
            value={shot.shotJson.getField("shot_type") || "shot_type"}
            options={["simple shot", "actor shot"]}
            onChange={(val) => { shot.shotJson?.updateField("shot_type", val) }}
          />

          <SimpleToggle
            label="Finished"
            value={!!shot.shotJson.data?.finished} // <-- controlled from JSON
            onToggle={(state) => {
              if (shot.shotJson) {
                shot.shotJson.updateField('finished', state);
              }
            }}
          />

          <SimpleButton onClick={() => { shot.log() }} label="Log Shot" />
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
            <Kling_GenerateVideo shot={shot}></Kling_GenerateVideo>
            <Kling_MotionControl shot={shot}></Kling_MotionControl>


            <TaskContainer shot={shot} />
            <MediaFolderGallery mediaFolder={shot.MediaFolder_genVideo}></MediaFolderGallery>



          </>
          ,
          LipSync: <>
            <Kling_LipSync shot={shot}/>

          </>
          ,


          "Output": <>
            <MediaFolderGallery mediaFolder={shot.MediaFolder_genVideo}></MediaFolderGallery>
            <MediaFolderGallery mediaFolder={shot.MediaFolder_results}></MediaFolderGallery>
            <MediaFolderGallery mediaFolder={shot.MediaFolder_refVideo}></MediaFolderGallery>
          </>
          ,

        }}
      />


    </>
  );
});

export default ShotInfoCard;
