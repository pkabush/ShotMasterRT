// ShotsInfoStrip
import React from 'react';
import { Scene } from '../classes/Scene';
import { observer } from 'mobx-react-lite';
import ShotStripPreview from './ShotStripPreview';
import ResizableContainer from './ResizableContainer';
import ShotInfoCard from './ShotInfoCard'; // Import the new ShotInfoCard
import SimpleButton from './Atomic/SimpleButton';
import LoadingButton from './Atomic/LoadingButton';

interface Props {
  scene: Scene;
}

const ShotsInfoStrip: React.FC<Props> = observer(({ scene }) => {
  const handleAddShot = async () => {
    const shotName = prompt("Enter new shot name:");
    if (!shotName) return;

    const newShot = await scene.createShot(shotName);
    if (newShot) { scene.selectShot(newShot) }
  };

  return (
    <div className="d-flex flex-column gap-3">
      {/* Resizable strip for shot previews */}
      <ResizableContainer initialHeight={200}>
        <div className="d-flex overflow-auto gap-2 h-100">
          {scene.shots.map((shot) => (
            <ShotStripPreview
              key={shot.name}
              shot={shot}
              isSelected={scene.selectedShot === shot }
              onClick={ () => {scene.selectShot(shot)}} 
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
        <SimpleButton label="Export Resolve XML" onClick={() => {scene.createResolveXML()}} />
      </div>

      {/* Show info card for the selected shot */}
      {scene.selectedShot && <ShotInfoCard shot={scene.selectedShot} />}
    </div>
  );
});

export default ShotsInfoStrip;
