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

interface Props {
  shot: Shot;
}

const ShotInfoCard: React.FC<Props> = observer(({ shot }) => {
  if (!shot.shotJson) return <div>Loading shot info...</div>;

  const itemHeight = 200;
  const files = shot.images ?? [];

  
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

            <SimpleButton onClick={() => console.log(shot)} label="Log Shot" />
            <SimpleButton onClick={handleDelete} label="Delete Shot" className="btn-outline-danger" />
          </div>
        </div>




        <EditableJsonTextField localJson={shot.shotJson} field="prompt" fitHeight />
        <EditableJsonTextField localJson={shot.shotJson} field="camera" fitHeight />
        <EditableJsonTextField localJson={shot.shotJson} field="action_description" fitHeight />

        <MediaGallery 
          label="Shot Results"
          headerExtra={
            <>

            <SimpleButton
              label="Generate"
              onClick={async () => {
                console.log("Generate Image");
              }}
            />

            <SimpleButton
              label="Import URL"
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  if (text && (text.startsWith("http://") || text.startsWith("https://"))) {
                    console.log("Importing URL from clipboard:", text);

                    const localImage = await LocalImage.fromUrl(text, shot.resultsFolder);
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
              topRightExtra={
                <>
                  <SimpleButton onClick={() => shot.setSrcImage(localImage)} label="Pick" />
                  <SimpleButton
                    onClick={async () => {
                      if (!window.confirm("Delete this image?")) return;

                      try {
                        await localImage.delete(shot.resultsFolder); // remove file
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
      </div>
    </div>
  );
});

export default ShotInfoCard;
