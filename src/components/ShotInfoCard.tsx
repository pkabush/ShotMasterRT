// ShotInfoCard.tsx
import React from 'react';
import { observer } from 'mobx-react-lite';
import { Shot } from '../classes/Shot';
import EditableJsonTextField from './EditableJsonTextField';
import MediaGallery from './MediaGallery';
import MediaGalleryImage from './MediaGalleryImage';
import SimpleButton from './SimpleButton';
import SimpleToggle from './SimpleToggle';
import { LocalImage } from '../classes/LocalImage';
//import LoadingButton from './LoadingButton';
import ImageEditWindow from './ImageEditWindow';
import TagsToggleList from "./TagsToggleList";
import LoadingSpinner from './Atomic/LoadingSpinner';
import SimpleSelect from './Atomic/SimpleSelect';
import { img_models } from '../classes/GoogleAI';
import SettingsButton from './SettingsButton';
import TaskContainer from './TaskContainer';
import MediaGalleryVideo from './MediaGalleryVideo';
import { KlingAI } from '../classes/KlingAI';
import { WorkflowOptionSelect } from './WorkflowOptionSelect';
import DropArea from './Atomic/DropArea';
import { LocalVideo } from '../classes/LocalVideo';
import { runInAction } from 'mobx';

interface Props {
  shot: Shot;
}

const ShotInfoCard: React.FC<Props> = observer(({ shot }) => {
  if (!shot.shotJson) return <div>Loading shot info...</div>;

  const itemHeight = 200;
  const files = shot.images ?? [];

  const project = shot.scene.project;


  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete shot "${shot.folder.name}"?`)) {
      await shot.delete();
    }
  };

  return (
    <div className="card mb-2">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <strong>{shot.folder.name}</strong>
          <div className="d-flex gap-2">
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

        {/* Pick shot type - crude implementation, fix later */}
        <div className="shot_type-group mb-2" role="group">
          <SimpleSelect
            value={shot.shotJson.getField("shot_type") || "shot_type"}
            options={["simple shot", "actor shot"]}
            onChange={(val) => { shot.shotJson?.updateField("shot_type", val) }}
          />
        </div>

        {/*GENERATE Image*/}
        <div className="mb-0">
          <div className="btn-group mb-2" role="group">
            {/**Button */}
            <button className="btn btn-sm btn-outline-success" onClick={async () => { shot.GenerateImage(); }}> Generate Image </button>
            {/**Model Selector */}
            <SimpleSelect
              value={shot.scene.project.workflows.generate_shot_image.model}
              options={img_models}
              onChange={(val) => { shot.scene.project.updateWorkflow("generate_shot_image", "model", val); }}
            />
            {/**Loading Spinner */}
            <LoadingSpinner isLoading={shot.is_generating} asButton />
          </div>
        </div>

        {/*GENERATE VIDEO | KLING | img2Video*/}
        <SettingsButton className='mb-2'
          buttons={
            <>
              {/**Button */}
              <button className="btn btn-sm btn-outline-success" onClick={async () => { shot.GenerateVideo(); }}> Generate Video</button>
              {/**MAKE UNIFIED SELECTOR?? */}

              {/**Model Selector */}
              <WorkflowOptionSelect project={project}
                workflowName="generate_video_kling" optionName="model"
                values={Object.values(KlingAI.options.img2video.model)}
              />
              <WorkflowOptionSelect project={project}
                workflowName="generate_video_kling" optionName="mode" label='mode:'
                values={Object.values(KlingAI.options.img2video.mode)}
              />
              <WorkflowOptionSelect project={project}
                workflowName="generate_video_kling" optionName="duration" label="Duration:"
                values={Object.values(KlingAI.options.img2video.duration)}
              />
              {/**Loading Spinner */}
              <LoadingSpinner isLoading={shot.is_submitting_video} asButton />
            </>
          }
          content={
            <>
            </>
          }
        />

        {/*GENERATE VIDEO | KLING | Motion Control Video*/}
        <SettingsButton className='mb-2'
          buttons={
            <>
              {/**Button */}
              <button className="btn btn-sm btn-outline-success" onClick={async () => {
                shot.GenerateVideo_KlingMotionControl();
              }}> Gen Motion Control Video</button>
              {/**MAKE UNIFIED SELECTOR?? */}

              {/**Model Selector */}
              <WorkflowOptionSelect project={project}
                workflowName="kling_motion_control" optionName="character_orientation" label='Orient:'
                values={Object.values(KlingAI.options.motion_control.character_orientation)}
              />
              <WorkflowOptionSelect project={project}
                workflowName="kling_motion_control" optionName="mode" label="mode:"
                values={Object.values(KlingAI.options.motion_control.mode)}
              />
              <WorkflowOptionSelect project={project} label="Sound:"
                workflowName="kling_motion_control" optionName="keep_original_sound"
                values={Object.values(KlingAI.options.motion_control.keep_original_sound)}
              />
              {/**Loading Spinner */}
              <LoadingSpinner isLoading={shot.is_submitting_video} asButton />
            </>
          }
          content={
            <>
              {/*Ref Video Preview */}
              {shot.kling_motion_video && (
                <MediaGalleryVideo
                  localVideo={shot.kling_motion_video}
                  height={400}
                  topRightExtra={<></>}
                />
              )}

              {/** VIDEOS Media Gallery */}
              <MediaGallery label="Reference Videos">
                {shot.ref_videos.map((localVideo, index) => (
                  <MediaGalleryVideo
                    key={index}
                    localVideo={localVideo}
                    height={200}
                    onClick={() => { shot.setKlingMotionReferenceVideo(localVideo) }}
                    topRightExtra={
                      <>
                        <SimpleButton
                          label="Delete"
                          className="btn-outline-danger btn-sm"
                          onClick={async () => {
                            await localVideo.delete();
                            shot.removeReferenceVideo(localVideo);
                          }}
                        />
                      </>
                    }
                  />
                ))}

                {/** DropArea for dragging videos */}
                <DropArea
                  width={100}
                  //height={200}
                  onDrop={async (file) => {
                    console.log(file);
                    // Save File To Local
                    const fileHandle = await shot.refVideoFolder!.getFileHandle(file.name, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write(file);
                    await writable.close();
                    console.log(`Saved file ${file.name} successfully!`);
                    // add Local Video
                    const localVideo = new LocalVideo(fileHandle as FileSystemFileHandle, shot.refVideoFolder!);
                    runInAction(()=> {shot.ref_videos.push(localVideo);})                    
                  }}
                >
                </DropArea>

              </MediaGallery>


            </>
          }
        />






        <TaskContainer shot={shot} />


        <EditableJsonTextField localJson={shot.shotJson} field="prompt" fitHeight />
        <EditableJsonTextField localJson={shot.shotJson} field="video_prompt" fitHeight />
        <EditableJsonTextField localJson={shot.shotJson} field="camera" fitHeight />
        <EditableJsonTextField localJson={shot.shotJson} field="action_description" fitHeight />
        <TagsToggleList shot={shot} />


        <MediaGallery
          label="Shot Results"
          headerExtra={
            <>
              {/*
            <LoadingButton label="Generate" className="btn-outline-success" onClick={async () => {shot.GenerateImage();}} is_loading={shot.is_generating}  />
            */}

              <SimpleButton
                label="Import URL"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text && (text.startsWith("http://") || text.startsWith("https://"))) {
                      console.log("Importing URL from clipboard:", text);

                      const localImage = await LocalImage.fromUrl(text, shot.resultsFolder as FileSystemDirectoryHandle);
                      shot.addImage(localImage);

                    } else {
                      alert("Clipboard does not contain a valid URL.");
                    }
                  } catch (err) {
                    console.error("Failed to read clipboard:", err);
                    alert("Failed to access clipboard.");
                  }
                }}
              />
            </>
          }
        >
          {files.map((localImage, index) => (
            <MediaGalleryImage
              key={index}
              localImage={localImage}
              height={itemHeight}
              onClick={() => {
                shot.selectArt(localImage);
              }}
              topRightExtra={
                <>
                  <SimpleButton onClick={() => shot.setSrcImage(localImage)} label="Pick" />
                  <SimpleButton
                    onClick={async () => {
                      if (!window.confirm("Delete this image?")) return;
                      try {
                        await localImage.delete(shot.resultsFolder as FileSystemDirectoryHandle); // remove file
                        shot.removeImage(localImage);                // update mobx list
                      } catch (err) {
                        console.error("Failed to delete image:", err);
                        alert("Failed to delete image.");
                      }
                    }}
                    label="Delete"
                    className="btn-outline-danger"
                  />
                </>
              }
            />
          ))}
        </MediaGallery>

        {/* Selected ArtInfoCard below thumbnails */}
        {shot.selected_art && (
          <ImageEditWindow
            localImage={shot.selected_art}
            initialText="Notes for this image"
            onImageGenerated={async (result) => {
              await shot.saveGoogleResultImage(result, true);
            }}
            onClose={() => {
              shot.selectArt()
            }}
          />
        )}


        {/** VIDEOS Media Gallery */}
        <MediaGallery label="Generated Videos">
          {shot.videos.map((localVideo, index) => (
            <MediaGalleryVideo
              key={index}
              localVideo={localVideo}
              height={500}
              topRightExtra={
                <>
                  <SimpleButton
                    label="Delete"
                    className="btn-outline-danger btn-sm"
                    onClick={async () => {
                      await localVideo.delete();
                      shot.removeVideo(localVideo);
                    }}
                  />
                </>
              }
            />
          ))}

        </MediaGallery>



      </div>
    </div>
  );
});

export default ShotInfoCard;
