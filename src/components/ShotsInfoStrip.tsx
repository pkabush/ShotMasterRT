// ShotsInfoStrip
import React, { useState, useEffect } from 'react';
import { Scene } from '../classes/Scene';
import { Shot } from '../classes/Shot';
import ShotStripPreview from './ShotStripPreview';
import ResizableContainer from './ResizableContainer';
import ShotInfoCard from './ShotInfoCard'; // Import the new ShotInfoCard

interface Props {
  scene: Scene;
}

const ShotsInfoStrip: React.FC<Props> = ({ scene }) => {
  const [selectedShot, setSelectedShot] = useState<Shot | null>(null);

  // Reset selected shot when scene changes
  useEffect(() => {
    setSelectedShot(null);
  }, [scene]);

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
        </div>
      </ResizableContainer>

      {/* Show info card for the selected shot */}
      {selectedShot && <ShotInfoCard shot={selectedShot} />}
    </div>
  );
};

export default ShotsInfoStrip;
