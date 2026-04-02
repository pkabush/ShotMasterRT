import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { observer } from "mobx-react-lite";
import { Project } from "../../classes/Project";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAlignRight, faBookTanakh, faClipboard, faFileCirclePlus, faFolder, faFolderPlus, faGear, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import type { JSX } from "react";
import { MenuItemIcon } from "../MediaFolderGallery";
import EditableJsonTextField from "../EditableJsonTextField";
import { Button } from "react-bootstrap";



export const PromptDropdownButton = observer(() => {
    const project = Project.getProject();
    const data = project.promptinfo;

    if (!data) return null;


    // Recursive menu generator
    const renderMenuItems = (node: any, path: string = "") => {
        const folders: JSX.Element[] = [];
        const strings: JSX.Element[] = [];

        Object.entries(node).forEach(([key, value]: [string, any]) => {
            const currentPath = path ? `${path}/contents/${key}` : key;

            if (value.type === "folder") {
                folders.push(
                    <DropdownMenu.Sub key={currentPath}>
                        <DropdownMenu.SubTrigger className="ContextMenuItem">
                            <MenuItemIcon><FontAwesomeIcon icon={faFolder} /></MenuItemIcon>
                            {key} ({Object.keys(value.contents || {}).length})
                        </DropdownMenu.SubTrigger>

                        <DropdownMenu.SubContent
                            className="ContextMenuContent"
                            sideOffset={2}
                            style={{ paddingLeft: 10 }}
                        >
                            {renderMenuItems(value.contents, currentPath)}
                        </DropdownMenu.SubContent>
                    </DropdownMenu.Sub>
                );
            } else if (value.type === "string") {
                const content = data.getField(`${currentPath}/contents`) || "";

                // Wrap string in Sub to show content on hover
                strings.push(
                    <DropdownMenu.Sub key={currentPath}>
                        <DropdownMenu.SubTrigger className="ContextMenuItem secondary" onClick={() => {
                            if (content) navigator.clipboard.writeText(content);
                        }}>
                            <MenuItemIcon><FontAwesomeIcon icon={faAlignRight} /></MenuItemIcon>
                            {key}
                        </DropdownMenu.SubTrigger>

                        <DropdownMenu.SubContent
                            className="ContextMenuContent"
                            sideOffset={2}
                            style={{ paddingLeft: 10, maxWidth: 800, minWidth: 400 }}
                        >
                            <EditableJsonTextField localJson={data} field={`${currentPath}/contents`}
                                headerExtra={
                                    <>
                                        <Button size="sm" onClick={() => {
                                            if (content) navigator.clipboard.writeText(content);
                                        }}>
                                            <FontAwesomeIcon icon={faClipboard} />
                                        </Button>
                                        <Button size="sm" onClick={() => {
                                            if (!currentPath) return;
                                            if (confirm(`Delete "${currentPath}"?`)) {
                                                data.updateField(currentPath, undefined);
                                            }

                                        }}>
                                            <FontAwesomeIcon icon={faTrashCan} />
                                        </Button>
                                    </>
                                } />
                        </DropdownMenu.SubContent>
                    </DropdownMenu.Sub>
                );
            }
        });

        return (
            <>
                {/* Render folders first, then strings */}
                {folders}
                {strings}

                <DropdownMenu.Separator className="DropdownMenuSeparator" />
                {/* Edit submenu at the bottom */}
                <DropdownMenu.Sub key={`${path}-edit`}>
                    <DropdownMenu.SubTrigger className="ContextMenuItem warning">
                        <MenuItemIcon><FontAwesomeIcon icon={faGear} /></MenuItemIcon>
                        Edit
                    </DropdownMenu.SubTrigger>

                    <DropdownMenu.SubContent
                        className="ContextMenuContent"
                        sideOffset={2}
                        style={{ paddingLeft: 10 }}
                    >
                        <DropdownMenu.Item
                            className="ContextMenuItem success"
                            onClick={(e) => {
                                e.stopPropagation();
                                const folderName = prompt("Folder name:");
                                if (!folderName) return;

                                const newPath = path
                                    ? `${path}/contents/${folderName}`
                                    : folderName;

                                data.updateField(newPath, {
                                    type: "folder",
                                    contents: {},
                                });
                            }}
                        >
                            <MenuItemIcon><FontAwesomeIcon icon={faFolderPlus} /></MenuItemIcon>
                            New Folder
                        </DropdownMenu.Item>

                        <DropdownMenu.Item
                            className="ContextMenuItem success"
                            onClick={(e) => {
                                e.stopPropagation();
                                const stringName = prompt("String name:");
                                if (!stringName) return;

                                const newPath = path
                                    ? `${path}/contents/${stringName}`
                                    : stringName;

                                data.updateField(newPath, {
                                    type: "string",
                                    contents: "",
                                });
                            }}
                        >
                            <MenuItemIcon><FontAwesomeIcon icon={faFileCirclePlus} /></MenuItemIcon>
                            New String
                        </DropdownMenu.Item>

                        <DropdownMenu.Item
                            className="ContextMenuItem danger"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!path) return;

                                if (confirm(`Delete "${path}"?`)) {
                                    data.updateField(path, undefined);
                                }
                            }}
                        >
                            <MenuItemIcon><FontAwesomeIcon icon={faTrashCan} /></MenuItemIcon>
                            Delete
                        </DropdownMenu.Item>
                    </DropdownMenu.SubContent>
                </DropdownMenu.Sub>
            </>
        );
    };

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild className="btn btn-warning btn-sm">
                <button>
                    <FontAwesomeIcon icon={faBookTanakh} style={{ fontSize: '20px' }} />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content
                align="start"
                className="ContextMenuContent"
                style={{ zIndex: 9999 }}
            >
                {renderMenuItems(data.data)}
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
});