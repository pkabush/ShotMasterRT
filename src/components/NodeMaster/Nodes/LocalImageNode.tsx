import React, { memo, useCallback, useMemo } from "react";
import {
    NodeResizeControl,
    NodeToolbar,
    Position,
    useReactFlow,
    type Node,
    type NodeProps,
} from "@xyflow/react";
import { FolderDropdownNode } from "../../FolderTags/FolderDropdown";
import { Project } from "../../../classes/Project";
import MediaPreview from "../../MediaComponents/MediaPreview";
import { LocalMedia } from "../../../classes/fileSystem/LocalMedia";
import { LocalVideo } from "../../../classes/fileSystem/LocalVideo";
import { MiniVideoEditor } from "../../MediaComponents/MiniVideoEditor";
import { NamedInputHandle, NamedOutputHandle } from "../Atomic/NamedInput";
import { useNodeGraphApi } from "../nodeGraphApi";
import { LocalFolder } from "../../../classes/fileSystem/LocalFolder";
import { LocalFile } from "../../../classes/fileSystem/LocalFile";
import MediaItemCard, { MenuItemIcon } from "../../MediaFolderGallery";
import { observer } from "mobx-react-lite";
import DropArea from "../../Atomic/DropArea";


export type LocalImageNodeDate = {
    path: string;
};

export type LocalImageNodeType = Node<LocalImageNodeDate, "textNode">;


const controlStyle = {
    background: 'transparent',
    border: 'none',
};


export const LocalImageNode = memo(
    ({ id, data, selected }: NodeProps<LocalImageNodeType>) => {
        const { setNodes } = useReactFlow();
        const ng_api = useNodeGraphApi();
        const project = Project.getProject();

        const local_image = useMemo(() => {
            return project.getByAbsPath(data.path) as LocalMedia;
        }, [data.path])

        const inputFolders = useMemo(() => {
            const input_paths = ng_api.getInputNodes(id).map((n) => {
                if (n.data.path) {
                    const file = project.getByAbsPath(n.data.path as string);
                    if (file instanceof LocalFolder) return file;
                    if ((file instanceof LocalFile) && file.parentFolder) return file.parentFolder;
                }
                return null;
            }).filter((p): p is LocalFolder => p !== null);
            return input_paths;
        }, [ng_api, id, project])

        const my_folder = useMemo(() => {
            const file = project.getByAbsPath(data.path);
            if (file instanceof LocalMedia && file.parentFolder) return file.parentFolder;
            if (file instanceof LocalFolder) return file;
            return null;
        }, [ng_api, id, project])

        const setPath = useCallback((path: string) => {
            setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, path: path, }, } : n));
        }, [setNodes, id])

        return (
            <>
                <NodeToolbar
                    isVisible={selected}
                    position={Position.Top}
                    align={"start"}
                >
                    <FolderDropdownNode
                        folder={project}
                        selected_paths={[data.path]}
                        onSelect={(item) => {
                            console.log(item);
                            setPath(item.path);
                        }} />

                    {inputFolders.map((folder) => (
                        <FolderDropdownNode
                            key={folder.path}
                            folder={folder}
                            onSelect={(item) => {
                                console.log(item);
                                setPath(item.path);
                            }}
                        />
                    ))}

                    {my_folder && <FolderDropdownNode
                        folder={my_folder}
                        selected_paths={[data.path]}
                        onSelect={(item) => {
                            console.log(item);
                            setPath(item.path);
                        }} />}

                </NodeToolbar>

                <NodeToolbar
                    isVisible={selected}
                    position={Position.Top}
                    align={"end"}
                >
                    <Button size="sm" onClick={() => {
                        const file = project.getByAbsPath(data.path);
                        if (file?.parentFolder)
                            setPath(file?.parentFolder!.path);
                    }}>Up</Button>
                </NodeToolbar>



                <div
                    style={{
                        background: "#111",
                        color: "white",
                        border: selected ? "2px solid #4da3ff" : "1px solid #333",
                        borderRadius: 12,
                        padding: 12,
                        width: "100%",
                        height: "100%",

                        display: "flex",
                        flexDirection: "column",
                        boxSizing: "border-box",
                        overflow: "hidden",


                        boxShadow: selected
                            ? "0 0 0 2px rgba(77,163,255,0.3)"
                            : "none",
                        transition: "all 0.15s ease",
                    }}
                >
                    <NodeResizeControl style={controlStyle} minWidth={200} minHeight={100} >
                        <ResizeIcon />
                    </NodeResizeControl>

                    <div
                        style={{
                            fontSize: 12,
                            marginBottom: 8,
                            opacity: 0.7,
                        }}
                    >

                        {data.path.split("/").map((part, index, parts) => {
                            const fullPath = parts.slice(0, index + 1).join("/");

                            return (
                                <React.Fragment key={fullPath}>
                                    <span
                                        style={{
                                            cursor: "pointer",
                                        }}
                                        onClick={() => {
                                            setPath(fullPath);
                                        }}
                                    >
                                        {part == "" ? "ROOT" : part}
                                    </span>

                                    {index < parts.length - 1 && " / "}
                                </React.Fragment>
                            );
                        })}
                    </div>


                    <div
                        style={{
                            flex: 1,
                            minHeight: 0,

                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",

                            overflow: "hidden",

                        }}
                    >

                        {/** Local Image / Local Video */}
                        {(local_image instanceof LocalMedia) && <>
                            {(local_image instanceof LocalVideo) && selected ?
                                <div className="d-flex align-items-center justify-content-center h-100 w-100 nodrag">
                                    <MiniVideoEditor localVideo={local_image} />
                                </div>
                                :
                                <MediaPreview
                                    media={local_image}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                        display: "block",
                                    }}
                                    autoPlay={true}
                                    loop={true}
                                    muted={true}
                                />}
                        </>}

                        {(local_image instanceof LocalFolder) && <>
                            <div className="h-100 w-100 nodrag">
                                <NodeMediaFolderGallery mediaFolder={local_image} onPathClick={(path) => {
                                    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, path: path, }, } : n));
                                }} />
                            </div>
                        </>}

                    </div>

                    <NamedOutputHandle id="path" />
                    <NamedInputHandle id="path" />

                </div>
            </>
        );
    }
);

LocalImageNode.displayName = "LocalImageNode";

function ResizeIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="#ff0071"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: 'absolute', right: 5, bottom: 5 }}
        >
            <polyline points="16 20 20 20 20 16" />
            <line x1="14" y1="14" x2="20" y2="20" />
            <polyline points="8 4 4 4 4 8" />
            <line x1="4" y1="4" x2="10" y2="10" />
        </svg>
    );
}


interface NodeMediaFolderGalleryProps {
    mediaFolder: LocalFolder;
    onPathClick: (path: string) => void;
}

import * as ContextMenu from "@radix-ui/react-context-menu";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboard } from "@fortawesome/free-solid-svg-icons";
import "../../../css/ContextMenu.css";
import { Button } from "react-bootstrap";

export const NodeMediaFolderGallery: React.FC<NodeMediaFolderGalleryProps> = observer(
    ({ mediaFolder, onPathClick }) => {

        return <DropArea width={"100%"} height={"100%"}
            onDropFiles={async (files) => { await mediaFolder.saveFiles(files); }}
            base_border="2px #606060"
        >

            <div className="d-flex flex-wrap w-100 h-100" style={{}}>
                <ContextMenu.Root>
                    <ContextMenu.Trigger style={{ backgroundColor: "#2c2c31", }} className="d-flex flex-wrap gap-2 w-100 h-100 align-content-start" >
                        {mediaFolder.parentFolder &&
                            <FolderPreview
                                localFolder={mediaFolder.parentFolder}
                                onClick={() => { onPathClick(mediaFolder.parentFolder!.path); }}
                                label="..."
                            />
                        }

                        {mediaFolder.subfolders.map((subfolder) => (
                            <FolderPreview
                                localFolder={subfolder}
                                onClick={() => { onPathClick(subfolder.path); }}
                            />
                        ))}

                        {mediaFolder.mediaOrdered.map((mediaItem) => (
                            <MediaItemCard
                                key={mediaItem.path}
                                mediaItem={mediaItem}
                                height={100}
                                isSelected={false}
                                onSelect={() => { onPathClick(mediaItem.path); }}
                            />
                        ))}

                        {false && <DropArea width={100} height={100} onDropFiles={async (files) => { await mediaFolder.saveFiles(files); }} />}
                    </ContextMenu.Trigger>

                    <ContextMenu.Portal>
                        <ContextMenu.Content className="ContextMenuContent">
                            <ContextMenu.Item className="ContextMenuItem" onClick={() => mediaFolder.copyFromClipboard()}>
                                <MenuItemIcon><FontAwesomeIcon icon={faClipboard} /></MenuItemIcon>
                                Paste
                            </ContextMenu.Item>
                            <ContextMenu.Item className="ContextMenuItem" onClick={() => mediaFolder.log()}>
                                <MenuItemIcon><FontAwesomeIcon icon={faClipboard} /></MenuItemIcon>
                                Log
                            </ContextMenu.Item>
                            <ContextMenu.Item className="ContextMenuItem" onClick={async () => {
                                try {
                                    const text = await navigator.clipboard.readText();
                                    if (text && (text.startsWith("http://") || text.startsWith("https://"))) {
                                        console.log("Importing URL from clipboard:", text);
                                        mediaFolder.downloadFromUrl(text);
                                    } else {
                                        alert("Clipboard does not contain a valid URL.");
                                    }
                                } catch (err) {
                                    console.error("Failed to read clipboard:", err);
                                    alert("Failed to access clipboard.");
                                }
                            }}>
                                <MenuItemIcon><FontAwesomeIcon icon={faClipboard} /></MenuItemIcon>
                                Import URL
                            </ContextMenu.Item>

                        </ContextMenu.Content>
                    </ContextMenu.Portal>
                </ContextMenu.Root>
            </div>

        </DropArea>
    });



interface FolderPreviewProps {
    localFolder: LocalFolder;
    onClick?: () => void;
    label?:string;
}

const FolderPreview = ({ localFolder, onClick ,label}: FolderPreviewProps) => {
    return (
        <div
            style={{
                width: 75,
                height: 100,
                border: "2px solid #4c4c4c",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "center",
                //alignItems: "center",
                cursor: "pointer",
                backgroundColor: "#2a2a31",
            }}
            onClick={onClick}
        >
            <span
                style={{
                    display: "block",
                    textAlign: "center",
                    width: "100%",
                    color: "#5e727e",
                }}
            >
                {label ? label : localFolder.name}
            </span>
        </div>
    );
};
