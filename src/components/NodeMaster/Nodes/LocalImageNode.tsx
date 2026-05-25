import { memo, useMemo } from "react";
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
                            setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, path: item.path, }, } : n));
                        }} />

                    {inputFolders.map((folder) => (
                        <FolderDropdownNode
                            key={folder.path}
                            folder={folder}
                            onSelect={(item) => {
                                console.log(item);
                                setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, path: item.path, }, } : n));
                            }}
                        />
                    ))}

                    {my_folder && <FolderDropdownNode
                        folder={my_folder}
                        selected_paths={[data.path]}
                        onSelect={(item) => {
                            console.log(item);
                            setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, path: item.path, }, } : n));
                        }} />}

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
                    <NodeResizeControl style={controlStyle} minWidth={400} minHeight={400} >
                        <ResizeIcon />
                    </NodeResizeControl>

                    <div
                        style={{
                            fontSize: 12,
                            marginBottom: 8,
                            opacity: 0.7,
                        }}
                    >
                        LocalImageNode {data.path}
                    </div>


                    {false && <>
                        <FolderDropdownNode
                            folder={project}
                            onSelect={(item) => {
                                console.log(item);
                                // up date path
                                setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, path: item.path, }, } : n));
                            }} />

                        <>
                            {data.path}
                        </>
                    </>}


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
                        
                        {local_image instanceof LocalVideo ?
                            <div className="d-flex align-items-center justify-content-center h-100 w-100">
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
                            />}




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