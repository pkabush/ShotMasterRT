import { memo, useMemo } from "react";
import {
    NodeResizeControl,    
    useReactFlow,
    type Node,
    type NodeProps,
} from "@xyflow/react";
import { FolderDropdownNode } from "../../FolderTags/FolderDropdown";
import { Project } from "../../../classes/Project";
import MediaPreview from "../../MediaComponents/MediaPreview";
import type { LocalMedia } from "../../../classes/fileSystem/LocalMedia";
import { LocalVideo } from "../../../classes/fileSystem/LocalVideo";
import { MiniVideoEditor } from "../../MediaComponents/MiniVideoEditor";
import { NamedInputHandle, NamedOutputHandle } from "../Atomic/NamedInput";


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
        const project = Project.getProject();

        const local_image = useMemo(() => {
            return project.getByAbsPath(data.path) as LocalMedia;
        }, [data.path])

        return (
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
                <NodeResizeControl style={controlStyle} minWidth={100} minHeight={50}>
                    <ResizeIcon />
                </NodeResizeControl>

                <div
                    style={{
                        fontSize: 12,
                        marginBottom: 8,
                        opacity: 0.7,
                    }}
                >
                    LocalImageNode
                </div>


                {true && <>
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