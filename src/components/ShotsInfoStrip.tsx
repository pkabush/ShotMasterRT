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
  const handleAddShot = async (e: any) => {
    if (e.ctrlKey) {
      const newShot = await scene.createShot();
      if (newShot) { scene.selectShot(newShot) }
    }
    else {
      const shotName = prompt("Enter new shot name:");
      if (!shotName) return;
      const newShot = await scene.createShot(shotName);
      if (newShot) { scene.selectShot(newShot) }
    }
  };

  return (
    <div className="d-flex flex-column gap-2">
      {/* Resizable strip for shot previews */}
      <ResizableContainer initialHeight={200}>
        <div className="d-flex overflow-auto gap-2 h-100">
          {scene.shots.map((shot) => (
            <ShotStripPreview
              key={shot.name}
              shot={shot}
              isSelected={scene.selectedShot === shot}
              onClick={() => { scene.selectShot(shot) }}
            />
          ))}

          <div className="mt-2">
            <SimpleButton label="+ Add Shot" onClick={handleAddShot} />
          </div>
        </div>
      </ResizableContainer>

      {/* Buttons */}
      <div className='my-0'>
        <LoadingButton onClick={() => { scene.generateAllShotImages() }} label="Generate ALL" is_loading={scene.is_generating_all_shot_images} />
        <SimpleButton label="Export Resolve XML" onClick={() => { scene.createResolveXML() }} />

        <SimpleButton label="+ Add Shot" onClick={handleAddShot}
          tooltip='Creates New SHOT.
Hold CTRL to auto Name Shot.'/>
      </div>

      {/* Show info card for the selected shot */}
      {scene.selectedShot && <ShotInfoCard shot={scene.selectedShot} />}
    </div>
  );
});

export default ShotsInfoStrip;
