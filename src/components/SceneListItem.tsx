import React from 'react';
import { observer } from 'mobx-react-lite'; // <-- import observer
import { Scene } from '../classes/Scene';
import ShotStatusBar from './ShotStatusBar';
import { Shot } from '../classes/Shot';

type Props = {
  scene: Scene;
};

// Wrap component in observer
const SceneListItem: React.FC<Props> = observer(({ scene }) => {
  const handleClick = () => {
    if (!scene || !scene.sceneJson) return;
    scene.project?.setView({ type: "scene" }, scene);
  };

  const isSelected = scene.project?.selectedScene === scene;

  return (
    <li
      className="d-flex justify-content-between align-items-center py-1 px-2"
      style={{ cursor: 'pointer' }}
      onClick={handleClick}
    >
      {/* Scene name */}
      <span className={isSelected ? 'text-success' : undefined}>
        {scene.name}
      </span>

      {/* Shots count: finished / total, light grey */}
      <span className="text-muted">
        {/**
        {scene.getShotsWithStatus("image_ready")} /{scene.getShotsWithStatus("video_ready")} / {scene.shots.length}
         */}
        <ShotStatusBar
          scene={scene}
          statuses={ Object.keys(Shot.shot_states) }
        />
      </span>
    </li>
  );
});

export default SceneListItem;
