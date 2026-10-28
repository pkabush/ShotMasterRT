import React from 'react';
import { observer } from 'mobx-react-lite';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faClipboard,
    faCopy,
    faEraser,
    faPaste,
    faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import type { Shot } from '../../../../../../classes/Shot';
import { MenuItemIcon } from '../../../../../MediaFolderGallery';
import { Action_PrevisJsonAddShot, Action_PrevisJsonRemoveShotIndex, getPrevisShotByIndex, updatePrevisShot } from './Previs_Actions';


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

                            if (!local_path) {
                                console.warn("local_path missing in clipboard data");
                                return;
                            }

                            console.log("Image Path", local_path);
                            updatePrevisShot(shot, index, "image_path", local_path);
                        } catch (err) {
                            console.error("Failed to read from clipboard", err);
                        }
                    }}
                >
                    <MenuItemIcon>
                        <FontAwesomeIcon icon={faPaste} />
                    </MenuItemIcon>
                    Paste Image
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
