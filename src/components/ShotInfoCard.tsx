import React from 'react';
import { observer } from 'mobx-react-lite';
import { Shot } from '../classes/Shot';
import EditableJsonTextField from './EditableJsonTextField';
import MediaGallery from './MediaGallery';
import MediaGalleryImage from './MediaGalleryImage';
import SimpleButton from './SimpleButton';

interface Props {
  shot: Shot;
}

const ShotInfoCard: React.FC<Props> = observer(({ shot }) => {
  if (!shot.shotJson) return <div>Loading shot info...</div>;

  const itemHeight = 200;
  const files = shot.images ?? [];

  return (
    <div className="card mb-2">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <strong>{shot.folder.name}</strong>
          <SimpleButton onClick={() => console.log(shot)} label="Log Shot" />
        </div>

        <EditableJsonTextField localJson={shot.shotJson} field="prompt" fitHeight />
        <EditableJsonTextField localJson={shot.shotJson} field="camera" fitHeight />
        <EditableJsonTextField localJson={shot.shotJson} field="action_description" fitHeight />

        <MediaGallery label="Shot Results">
          {files.map((localImage, index) => (
            <MediaGalleryImage
              key={index}
              localImage={localImage}
              height={itemHeight}
              topRightExtra={
                <>
                  <SimpleButton onClick={() => shot.setSrcImage(localImage)} label="Pick" />
                  <SimpleButton onClick={() => console.log('Delete clicked!', localImage)} label="Delete" />
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
