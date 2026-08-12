import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { LocalFolder } from '../../classes/fileSystem/LocalFolder';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { MenuItemIcon } from '../MediaFolderGallery';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronRight,
    faChevronDown,
    faClipboard,
    faTrashCan,
} from '@fortawesome/free-solid-svg-icons';

type LocalFolderTreeItemProps = {
    localFolder: LocalFolder;
};

const LocalFolderTreeItem: React.FC<LocalFolderTreeItemProps> = observer(
    ({ localFolder }) => {
        const [isOpen, setIsOpen] = useState(false);

        const hasSubfolders = localFolder.subfolders.length > 0;

        const toggleOpen = () => {
            if (hasSubfolders) {
                setIsOpen((current) => !current);
            }
        };

        return (
            <li
                style={{
                    listStyle: 'none',
                }}
            >
                <ContextMenu.Root key={localFolder.path}>
                    <ContextMenu.Trigger asChild>
                        <div
                            className="d-flex align-items-center py-1 px-2"
                            style={{
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {/* Expand / collapse button */}
                            <span
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleOpen();
                                }}
                                style={{
                                    width: '18px',
                                    minWidth: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: hasSubfolders
                                        ? 'pointer'
                                        : 'default',
                                }}
                            >
                                {hasSubfolders && (
                                    <FontAwesomeIcon
                                        icon={
                                            isOpen
                                                ? faChevronDown
                                                : faChevronRight
                                        }
                                        size="xs"
                                    />
                                )}
                            </span>

                            {/* Folder name */}
                            <span onClick={toggleOpen} style={{ overflow: 'hidden', textOverflow: 'ellipsis', }}                            >
                                {localFolder.name}
                            </span>
                        </div>
                    </ContextMenu.Trigger>

                    <ContextMenu.Portal>
                        <ContextMenu.Content className="ContextMenuContent">
                            <ContextMenu.Item
                                className="ContextMenuItem"
                                onClick={() => localFolder.log()}
                            >
                                <MenuItemIcon>
                                    <FontAwesomeIcon icon={faClipboard} />
                                </MenuItemIcon>
                                Log
                            </ContextMenu.Item>


                            <ContextMenu.Item
                                className="ContextMenuItem danger"
                                onClick={() => localFolder.delete()}
                            >
                                <MenuItemIcon>
                                    <FontAwesomeIcon icon={faTrashCan} />
                                </MenuItemIcon>
                                Delete
                            </ContextMenu.Item>


                            <ContextMenu.Item
                                className="ContextMenuItem"
                                onClick={() => {
                                    const name = window.prompt('Enter subfolder name:');
                                    if (!name?.trim()) { return; }
                                    LocalFolder.open(localFolder, name.trim(), LocalFolder);
                                }}
                            >
                                <MenuItemIcon>
                                    <FontAwesomeIcon icon={faClipboard} />
                                </MenuItemIcon>
                                Create Subfolder
                            </ContextMenu.Item>

                        </ContextMenu.Content>
                    </ContextMenu.Portal>
                </ContextMenu.Root>

                {/* Children */}
                {hasSubfolders && isOpen && (
                    <ul
                        className="m-0 ps-3"
                        style={{
                            listStyle: 'none',
                        }}
                    >
                        {localFolder.subfolders.map((subfolder) => (
                            <LocalFolderTreeItem
                                key={subfolder.path}
                                localFolder={subfolder}
                            />
                        ))}
                    </ul>
                )}
            </li>
        );
    }
);

export default LocalFolderTreeItem;