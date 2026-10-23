import React from 'react';
import { observer } from 'mobx-react-lite';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArchive,
  faClipboard,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';

import { MenuItemIcon } from '../../MediaFolderGallery';
import type { Shot } from '../../../classes/Shot';

interface ShotContextMenuProps {
  shot: Shot;
}

const ShotContextMenu: React.FC<ShotContextMenuProps> = observer(({ shot }) => {
  const handleDownloadZip = () => {
    const zipName =
      `${shot.scene.project.name}_${shot.path.replaceAll('/', '_')}.zip`;

    console.log('Downloading ZIP', zipName);
    shot.downloadAsZip(zipName);
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete shot "${shot.name}"?`)) {
      await shot.delete();
    }
  };

  return (
    <ContextMenu.Portal>
      <ContextMenu.Content className="ContextMenuContent">
        <ContextMenu.Item
          className="ContextMenuItem"
          onSelect={() => console.log(shot)}
        >
          <MenuItemIcon>
            <FontAwesomeIcon icon={faClipboard} />
          </MenuItemIcon>
          Log
        </ContextMenu.Item>

        <ContextMenu.Item
          className="ContextMenuItem warning"
          onSelect={handleDownloadZip}
        >
          <MenuItemIcon>
            <FontAwesomeIcon icon={faArchive} />
          </MenuItemIcon>
          Download Zip
        </ContextMenu.Item>

        <ContextMenu.Item
          className="ContextMenuItem danger"
          onSelect={handleDelete}
        >
          <MenuItemIcon>
            <FontAwesomeIcon icon={faTrashCan} />
          </MenuItemIcon>
          Delete
        </ContextMenu.Item>
        
      </ContextMenu.Content>
    </ContextMenu.Portal>
  );
});

interface ShotContextMenuWrapperProps {
  shot: Shot;
  children: React.ReactNode;
}

export const ShotContextMenuWrapper: React.FC<ShotContextMenuWrapperProps> = observer(
  ({ shot, children }) => (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {children}
      </ContextMenu.Trigger>

      <ShotContextMenu shot={shot} />
    </ContextMenu.Root>
  )
);

export default ShotContextMenu;
