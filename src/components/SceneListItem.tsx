import React from 'react';
import { observer } from 'mobx-react-lite'; // <-- import observer
import { Scene } from '../classes/Scene';

type Props = {
  scene: Scene;
};

// Wrap component in observer
const SceneListItem: React.FC<Props> = observer(({ scene }) => {
  const handleClick = () => {
    if (!scene || !scene.sceneJson) return;
    scene.project?.setView({ type: "scene" }, scene);
  };

  return (
    <li
      className="d-flex justify-content-between align-items-center py-1 px-2"
      style={{ cursor: 'pointer' }}
      onClick={handleClick}
    >
      {/* Scene name */}
      <span>{scene.folder.name}</span>

      {/* Shots count: finished / total, light grey */}
      <span className="text-muted">
        {scene.finishedShotsNum} / {scene.shots.length}        
      </span>
    </li>
  );
});

export default SceneListItem;
