// ShotsInfoStrip
import React, { useState, useEffect } from 'react';
import { Scene } from '../classes/Scene';
import { Shot } from '../classes/Shot';
import { observer } from 'mobx-react-lite';
import ShotStripPreview from './ShotStripPreview';
import ResizableContainer from './ResizableContainer';
import ShotInfoCard from './ShotInfoCard'; // Import the new ShotInfoCard
import SimpleButton from './SimpleButton';
import LoadingButton from './LoadingButton';
import SettingsButton from './SettingsButton';
import SimpleSelect from './Atomic/SimpleSelect';
import LoadingSpinner from './Atomic/LoadingSpinner';
import EditableJsonTextField from './EditableJsonTextField';

interface Props {
  scene: Scene;
}

const ShotsInfoStrip: React.FC<Props> = observer(({ scene }) => {
  const [selectedShot, setSelectedShot] = useState<Shot | null>(null);

  // Reset selected shot when scene changes
  useEffect(() => {
    setSelectedShot(null);
  }, [scene]);

  const handleAddShot = async () => {
    const shotName = prompt("Enter new shot name:");
    if (!shotName) return;

    const newShot = await scene.createShot(shotName);
    if (newShot) {
      setSelectedShot(newShot); // optionally select the new shot
    }
  };

  return (
    <div className="d-flex flex-column gap-3">
      {/* Resizable strip for shot previews */}
      <ResizableContainer initialHeight={200}>
        <div className="d-flex overflow-auto gap-2 h-100">
          {scene.shots.map((shot) => (
            <ShotStripPreview
              key={shot.folder.name}
              shot={shot}
              isSelected={selectedShot === shot}
              onClick={setSelectedShot}
            />
          ))}

          <div className="mt-2">
            <SimpleButton label="+ Add Shot" onClick={handleAddShot} />
          </div>
        </div>
      </ResizableContainer>

      {/* Buttons */}
      <div>
        <LoadingButton onClick={() => { scene.generateAllShotImages() }} label="Generate ALL" is_loading={scene.is_generating_all_shot_images} />
        <SimpleButton label="+ Add Shot" onClick={handleAddShot} />

        <SettingsButton className="mb-2"
          buttons={
            <>
              {/**Button */}
              <button className="btn btn-sm btn-outline-secondary" onClick={async () => {
                  scene.createResolveXML();
              }}> Create Resolve XML </button>
            </>
          }
          content={
            <>

            </>
          }
        />


      </div>

      {/* Show info card for the selected shot */}
      {selectedShot && <ShotInfoCard shot={selectedShot} />}
    </div>
  );
});

export default ShotsInfoStrip;
