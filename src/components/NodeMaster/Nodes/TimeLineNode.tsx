import { memo, useCallback, useMemo } from "react";
import { NodeResizeControl, useStore, type Node, type NodeProps } from "@xyflow/react";
import { NamedInputHandle, NamedOutputHandle } from "../Atomic/NamedInput";
import { useNodeGraphApi } from "../nodeGraphApi";
import { Project } from "../../../classes/Project";
import { VideoPlaylist } from "../../SceneViews/TimelineView";
import { NodeResizeIcon } from "./LocalImageNode";


export type TimelineNodeModelData = {

};

export type TimelineNodeModelType = Node<TimelineNodeModelData, "mergeNode">;

const controlStyle = {
    background: 'transparent',
    border: 'none',
};

export const TimelineNode = memo(
    ({ id, selected }: NodeProps<TimelineNodeModelType>) => {
        const nodegraph_api = useNodeGraphApi();
        const incomingCount = nodegraph_api.useDynamicInputHandles(id);

        const project = Project.getProject();

        const edges = useStore((state) => state.edges);
        
        const clips = useMemo(() => {
            const inputNodes = nodegraph_api.getIndexedInputNodes(id);
            const medias: any[] = [];

            for (const node of inputNodes) {
                if (!node) continue;

                switch (node.type) {
                    case "localImageNode":
                        if (node.data.path) {
                            const media = project.getByAbsPath(node.data.path as string);
                            if (media) medias.push(media);
                        }
                        break;
                    default:
                        break;
                }
            }


            return medias.map(media => ({
                video: media,
                label: "test"
            }));
        }, [nodegraph_api,edges])      

        const onIndexReorder = useCallback((old_index: number, new_index: number) => {       
            nodegraph_api.reorderIndexedInputs(old_index, new_index,id);      
        }, [ nodegraph_api,incomingCount])

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

                <NodeResizeControl style={controlStyle} minWidth={200} minHeight={100} >
                    <NodeResizeIcon />
                </NodeResizeControl>

                <div style={{ fontSize: 12, marginBottom: 8, opacity: 0.7 }}>
                    Timeline
                </div>

                <div className="nodrag">
                    <VideoPlaylist clips={clips} onIndexReorder={onIndexReorder}/>
                </div>


                {/* OUTPUT HANDLE */}
                <NamedOutputHandle id="out" />
                {/* Multi INPUT HANDLE */}
                {Array.from({ length: incomingCount + 1 }).map((_, index) => (
                    <NamedInputHandle id={`input_${index}`} index={index} />
                ))}

            </div >
        );
    }
);

TimelineNode.displayName = "ButtonNode";



