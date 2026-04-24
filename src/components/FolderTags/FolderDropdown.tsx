import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import React from "react";
import { observer } from "mobx-react-lite";
import { LocalFolder } from "../../classes/fileSystem/LocalFolder";
import { MediaPreviewSmall } from "../MediaComponents/MediaPreviewSmall";
import "../../css/Dropdown.css";
import { Stack } from "react-bootstrap";
import type { LocalItem } from "../../classes/fileSystem/LocalItem";
import { LocalMedia } from "../../classes/fileSystem/LocalMedia";

interface FolderDropdownProps {
    folder: LocalFolder;
    onSelect?: (item: LocalItem) => void;
    label?: React.ReactNode;
    isRoot?: boolean;
    selected_paths?: string[];
    show_empty?: boolean;
}

/* -------------------- Recursive Node -------------------- */
export const FolderDropdownNode: React.FC<FolderDropdownProps> = observer(
    ({ folder, onSelect, label, isRoot = true, selected_paths = [], show_empty = false }) => {
        const subfolders = folder.getType(LocalFolder);
        const images = folder.getType(LocalMedia);
        const all_images = folder.getType(LocalMedia, { deep: true });
        const isSelectedSubpath = isSubpath(folder.path, selected_paths);

        const hasChildren = subfolders.length > 0 || images.length > 0;

        if (!show_empty && all_images.length === 0) return null;

        const content = (
            <>
                {subfolders.map((sub) => (
                    <FolderDropdownNode
                        key={sub.path}
                        folder={sub}
                        onSelect={onSelect}
                        isRoot={false}
                        selected_paths={selected_paths}
                        show_empty={show_empty}
                    />
                ))}

                {images.length > 0 && subfolders.length > 0 && (
                    <DropdownMenu.Separator />
                )}

                {images.map((image) => {
                    const isSelected = selected_paths.some(
                        (p) => p.replace(/\\/g, "/") === image.path.replace(/\\/g, "/")
                    );

                    return (
                        <DropdownMenu.Item
                            key={image.path}
                            className={`dropdown-item ${isSelected ? "dropdown-item-selected" : ""}`}
                            onSelect={(event) => {
                                event.preventDefault(); // <-- prevents menu from closing
                                onSelect?.(image);
                            }}
                        >
                            <Stack direction="horizontal" gap={0}>
                                <div
                                    className={`rounded-circle mx-1 ${isSelected ? 'bg-success' : 'border border-secondary'}`}
                                    style={{ width: '15px', height: '15px', }}
                                />
                                <MediaPreviewSmall
                                    media={image}
                                    filenameVisibleChars={20}
                                    openOnClick={false}
                                />
                            </Stack>
                        </DropdownMenu.Item>
                    );
                })}
            </>
        );

        if (isRoot) {
            return (
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger className="btn btn-success btn-sm">
                        {label ?? folder.name}
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Portal>
                        <DropdownMenu.Content
                            className="dropdown-content"
                            align="start"
                            side="right"
                        >
                            {content}
                        </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                </DropdownMenu.Root>
            );
        }

        if (!hasChildren) {
            return (
                show_empty &&
                <DropdownMenu.Item
                    className="dropdown-item"
                    onSelect={() => onSelect?.(folder)}
                >
                    {folder.name}
                </DropdownMenu.Item>
            );
        }

        return (
            <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger
                    className={`submenu-trigger ${isSelectedSubpath ? "submenu-selected" : ""}`}
                >
                    {folder.name} <span style={{ color: "#999" }}>({all_images.length})</span>
                </DropdownMenu.SubTrigger>

                <DropdownMenu.Portal>
                    <DropdownMenu.SubContent
                        className="dropdown-content"
                        sideOffset={0}
                        alignOffset={0}
                        avoidCollisions={false}
                    >
                        {content}
                    </DropdownMenu.SubContent>
                </DropdownMenu.Portal>
            </DropdownMenu.Sub>
        );
    }
);


const isSubpath = (path: string, selectedPaths: string[]) => {
    const normalizedFolder = path.replace(/\\/g, "/");
    return selectedPaths.some((selected) => {
        const normSelected = selected.replace(/\\/g, "/");
        return normSelected.startsWith(normalizedFolder + "/");
    });
};