// SceneListItem.tsx
import React from 'react';
import { useContent } from '../contexts/ContentContext';
import TabsContainer from './TabsContainer';
import { Scene } from '../classes/Scene';
import ShotsInfoStrip from './ShotsInfoStrip';
import SceneInfoCard from './SceneInfoCard';

type Props = {
  scene: Scene;
};

const SceneListItem: React.FC<Props> = ({ scene }) => {
  const { setContentArea } = useContent();

  const handleClick = () => {
    if (!scene || !scene.sceneJson) return;

    setContentArea(
      <div>
        <h2>{scene.folder.name}</h2>
        <TabsContainer
          tabs={{
            Scene: <SceneInfoCard scene={scene} />,
            Shots: <ShotsInfoStrip scene={scene} />,
          }}
        />
      </div>
    );
  };

  return (
    <li
      className="d-flex justify-content-between align-items-center py-1 px-2"
      style={{ cursor: 'pointer' }}
      onClick={handleClick}
    >
      {/* Scene name */}
      <span>{scene.folder.name}</span>

      {/* Shots count */}
      <span>{scene.shots.length}</span>
    </li>
  );
};

export default SceneListItem;
