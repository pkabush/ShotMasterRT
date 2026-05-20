import React from 'react';
import { observer } from 'mobx-react-lite'; // <-- import observer
import { Scene } from '../classes/Scene';
import ShotStatusBar from './ShotStatusBar';
import { Shot } from '../classes/Shot';
import * as ContextMenu from "@radix-ui/react-context-menu";
import { MenuItemIcon } from './MediaFolderGallery';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboard, faTrashCan } from '@fortawesome/free-solid-svg-icons';

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
    <ContextMenu.Root key={scene.path}>
      <ContextMenu.Trigger>
        <li
          className="d-flex justify-content-between align-items-center py-1 px-2"
          style={{ cursor: 'pointer' }}
          onClick={handleClick}
          onContextMenu={handleClick}
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
              statuses={Object.keys(Shot.shot_states)}
            />
          </span>
        </li>
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content className="ContextMenuContent">
          <ContextMenu.Item className="ContextMenuItem" onClick={() => scene.log()}>
            <MenuItemIcon><FontAwesomeIcon icon={faClipboard} /></MenuItemIcon>
            Log
          </ContextMenu.Item>

          <ContextMenu.Item className="ContextMenuItem danger" onClick={() => { scene.delete() }}>
            <MenuItemIcon><FontAwesomeIcon icon={faTrashCan} /></MenuItemIcon>
            Delete
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
});

export default SceneListItem;
