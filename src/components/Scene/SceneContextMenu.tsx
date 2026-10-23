import React from 'react';
import { observer } from 'mobx-react-lite';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboard, faFileImport, faTrashCan, faWheelchair } from '@fortawesome/free-solid-svg-icons';

import type { Scene } from '../../classes/Scene';
import { MenuItemIcon } from '../MediaFolderGallery';
import type { LocalFolder } from '../../classes/fileSystem/LocalFolder';

export const importShotZip = async (folder: LocalFolder) => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".zip,application/zip";

  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;

    try {
      await folder.extractZip(file);
      console.log(`Imported ${file.name} successfully`);
    } catch (error) {
      console.error("Failed to import ZIP:", error);
    }
  };

  input.click();
};


interface SceneContextMenuProps {
    scene: Scene;
}

const SceneContextMenu: React.FC<SceneContextMenuProps> = observer(
    ({ scene }) => {

        return (
            <ContextMenu.Portal>
                <ContextMenu.Content className="ContextMenuContent">

                    <ContextMenu.Item
                        className="ContextMenuItem"
                        onSelect={() => console.log(scene)}
                    >
                        <MenuItemIcon>
                            <FontAwesomeIcon icon={faClipboard} />
                        </MenuItemIcon>
                        Log
                    </ContextMenu.Item>

                    <ContextMenu.Item
                        className="ContextMenuItem warning"
                        onSelect={() => {scene.createResolveXML()}}
                    >
                        <MenuItemIcon>
                            <FontAwesomeIcon icon={faWheelchair} />
                        </MenuItemIcon>
                        Export Resolve XML
                    </ContextMenu.Item>

                    <ContextMenu.Item
                        className="ContextMenuItem warning"
                        onSelect={() => {importShotZip(scene)}}
                    >
                        <MenuItemIcon>
                            <FontAwesomeIcon icon={faFileImport} />
                        </MenuItemIcon>
                        Import Shot.zip
                    </ContextMenu.Item>




                    <ContextMenu.Item
                        className="ContextMenuItem danger"
                        onSelect={() => { scene.delete();}}
                    >
                        <MenuItemIcon>
                            <FontAwesomeIcon icon={faTrashCan} />
                        </MenuItemIcon>
                        Delete
                    </ContextMenu.Item>


                </ContextMenu.Content>
            </ContextMenu.Portal>
        );
    }
);

interface SceneContextMenuWrapperProps {
    scene: Scene;
    children: React.ReactNode;
}

export const SceneContextMenuWrapper: React.FC<SceneContextMenuWrapperProps> =
    observer(({ scene, children }) => (
        <ContextMenu.Root>
            <ContextMenu.Trigger asChild>
                {children}
            </ContextMenu.Trigger>

            <SceneContextMenu scene={scene} />
        </ContextMenu.Root>
    ));

export default SceneContextMenu;