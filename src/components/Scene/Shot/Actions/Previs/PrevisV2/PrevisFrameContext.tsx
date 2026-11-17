import React from 'react';
import { observer } from 'mobx-react-lite';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faClapperboard,
    faClipboard,
    faCopy,
    faEraser,
    faIndent,
    faPaste,
    faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import type { Shot } from '../../../../../../classes/Shot';
import { MenuItemIcon } from '../../../../../MediaFolderGallery';
import { Action_PrevisJsonAddShot, Action_PrevisJsonRemoveShotIndex, getPrevisShotByIndex, getPrevisShotTileImageByIndex, updatePrevisShot, updatePrevisShotData } from './Previs_Actions';

interface PrevisFrameContextMenuProps {
    shot: Shot;
    index: number;
}

const PrevisFrameContextMenu: React.FC<PrevisFrameContextMenuProps> = observer(({ shot, index }) => {

    return (
        <ContextMenu.Portal>
            <ContextMenu.Content className="ContextMenuContent">
                <ContextMenu.Item
                    className="ContextMenuItem warning"
                    onSelect={() => { Action_PrevisJsonAddShot(shot, undefined, index) }}
                >
                    <MenuItemIcon>
                        <FontAwesomeIcon icon={faCopy} />
                    </MenuItemIcon>
                    Duplicate
                </ContextMenu.Item>

                <ContextMenu.Item
                    className="ContextMenuItem"
                    onSelect={() => { console.log(getPrevisShotByIndex(shot, index)); }}
                >
                    <MenuItemIcon>
                        <FontAwesomeIcon icon={faClipboard} />
                    </MenuItemIcon>
                    Log
                </ContextMenu.Item>


                <ContextMenu.Item
                    className="ContextMenuItem warning"
                    onSelect={async () => {
                        try {
                            // Try To Read Image Path from clipboard
                            const text = await navigator.clipboard.readText();
                            if (!text) { console.warn("Clipboard is empty"); return; }

                            let data;
                            try {
                                data = JSON.parse(text);
                            } catch (jsonErr) {
                                console.error("Clipboard does not contain valid JSON", jsonErr);
                                return;
                            }

                            const local_path = data?.local_path;

                            if (local_path) {
                                console.log("[ShotData] Clipboard Image Path", local_path);
                                updatePrevisShot(shot, index, "image_path", local_path);
                            }

                            const shot_data = data?.previs_shot_data;
                            if (shot_data) {
                                console.log("[ShotData] Clipboard Shot Data", shot_data);
                                updatePrevisShotData(shot, index, shot_data);
                            }


                        } catch (err) {
                            console.error("Failed to read from clipboard", err);
                        }
                    }}
                >
                    <MenuItemIcon>
                        <FontAwesomeIcon icon={faPaste} />
                    </MenuItemIcon>
                    Paste Image/Shot
                </ContextMenu.Item>

                <ContextMenu.Item
                    className="ContextMenuItem warning"
                    onSelect={() => { updatePrevisShot(shot, index, "image_path", null); }}
                >
                    <MenuItemIcon>
                        <FontAwesomeIcon icon={faEraser} />
                    </MenuItemIcon>
                    Clear Image
                </ContextMenu.Item>

                <ContextMenu.Item
                    className="ContextMenuItem warning"
                    onSelect={() => {
                        const shotData = getPrevisShotByIndex(shot, index);
                        const shot_image = getPrevisShotTileImageByIndex(shot, index);
                        if (shot_image) shot_image.mediaJson?.updateField("storyboard_index", shotData.tile_index ?? index);
                    }}
                >
                    <MenuItemIcon>
                        <FontAwesomeIcon icon={faIndent} />
                    </MenuItemIcon>
                    Set Index on current Image
                </ContextMenu.Item>

                <ContextMenu.Item
                    className="ContextMenuItem warning"
                    onSelect={async () => {
                        const shotData = getPrevisShotByIndex(shot, index);

                        console.log(shotData);
                        shotData.tile_index ??= index;

                        await navigator.clipboard.writeText(
                            JSON.stringify({ previs_shot_data: shotData, })
                        );
                    }}
                >
                    <MenuItemIcon>
                        <FontAwesomeIcon icon={faClapperboard} />
                    </MenuItemIcon>
                    Copy Shot
                </ContextMenu.Item>


                <ContextMenu.Item
                    className="ContextMenuItem danger"
                    onSelect={() => { Action_PrevisJsonRemoveShotIndex(shot, index); }}
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

interface PrevisFrameContextMenuWrapperProps {
    shot: Shot;
    index: number;
    children: React.ReactNode;
}

export const PrevisFrameContextMenuWrapper: React.FC<PrevisFrameContextMenuWrapperProps> = observer(
    ({ shot, index, children }) => (
        <ContextMenu.Root>
            <ContextMenu.Trigger asChild>
                {children}
            </ContextMenu.Trigger>

            <PrevisFrameContextMenu shot={shot} index={index} />
        </ContextMenu.Root>
    )
);

export default PrevisFrameContextMenu;
