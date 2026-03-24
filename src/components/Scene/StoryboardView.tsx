import { observer } from "mobx-react-lite";
import type { Storyboard } from "../../classes/Storyboard";
import EditableJsonTextField from "../EditableJsonTextField";
import { TagsFolderContainer } from "../FolderTags/FolderTagsVide";
import { Project } from "../../classes/Project";
import type { LocalFolder } from "../../classes/fileSystem/LocalFolder";
import { MediaFolderGallery } from "../MediaFolderGallery";
import { PreviewStrip } from "../Containers/PreviewStrip";
import MediaPreview from "../MediaComponents/MediaPreview";
import DropArea from "../Atomic/DropArea";
import { Accordion, Button } from "react-bootstrap";
import { useState } from "react";
import type { LocalMedia } from "../../classes/fileSystem/LocalMedia";
import { CollapsibleContainerAccordion } from "../Atomic/CollapsibleContainer";
import SettingsButton from "../Atomic/SettingsButton";
import { WorkflowOptionSelect, WorkflowTextField } from "../WorkflowOptionSelect";
import { AI, AllImageModels, AllTextModels } from "../../classes/AI_provider";
import LoadingSpinner from "../Atomic/LoadingSpinner";
import { GoogleAI } from "../../classes/GoogleAI";


interface StoryboardViewProps {
    storyboard: Storyboard | null;
}


export const StoryboardView: React.FC<StoryboardViewProps> = observer(({ storyboard }) => {
    if (!storyboard) return;
    const project = Project.getProject();
    const [hoverPosition, setHoverPosition] = useState<"left" | "center" | "right" | null>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return <div>
        <EditableJsonTextField localJson={storyboard.scene.sceneJson} field="script" fitHeight collapsed={true} />

        <div className="mb-2">
            <PreviewStrip >
                {storyboard.storyboard.map((path, index) => {
                    const media = storyboard.getByAbsPath(path) as LocalMedia;
                    if (!media) return;

                    const isDraggedOver = hoveredIndex == index;

                    const centerHovered = isDraggedOver && hoverPosition === "center"
                    const leftHovered = (isDraggedOver && hoverPosition === "left") || ((hoveredIndex == (index - 1)) && hoverPosition === "right")
                    const rightHovered = isDraggedOver && hoverPosition === "right" || ((hoveredIndex == (index + 1)) && hoverPosition === "left")

                    return <div
                        onClick={(e) => {
                            if (e.ctrlKey) { storyboard.removeImage(path); }
                        }}

                        onDragOver={(e) => {
                            e.preventDefault();

                            const rect = e.currentTarget.getBoundingClientRect();
                            const relativeX = (e.clientX - rect.left) / rect.width;

                            let newPosition: "left" | "center" | "right";
                            if (relativeX <= 0.30) newPosition = "left";
                            else if (relativeX <= 0.7) newPosition = "center";
                            else newPosition = "right";

                            if (hoverPosition !== newPosition) {
                                setHoverPosition(newPosition);
                            }

                            if (hoveredIndex !== index) {
                                setHoveredIndex(index);
                            }
                        }}
                        onDragLeave={() => {
                            setHoveredIndex(null);
                        }}
                        onDrop={
                            (e: React.DragEvent<HTMLDivElement>) => {
                                e.preventDefault();
                                setHoveredIndex(null);
                                const local_path = e.dataTransfer.getData("LocalFilePath");
                                const offset = hoverPosition === "left" ? -1 : 0;
                                if (local_path) {
                                    storyboard.addImage(local_path, index + offset, hoverPosition === "center");
                                }
                            }
                        }

                        key={`path${index}`}
                        className="flex-shrink-0 position-relative d-flex align-items-center justify-content-center"


                    >

                        <MediaPreview
                            media={media}
                            className="img-fluid"
                            style={{
                                height: '100%',
                                width: 'auto',
                                objectFit: 'contain',
                                display: 'block',
                                //border: centerHovered ? "4px solid #42a5f5" : "",
                            }}
                            autoPlay={true}
                            loop={true}
                            muted={true}
                        />

                        {(centerHovered || leftHovered || rightHovered) && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    pointerEvents: "none",
                                    boxShadow: centerHovered
                                        ? "inset 0 0 0 4px #42a5f5"
                                        : leftHovered
                                            ? "inset 15px 0 0 0 #42a5f5"
                                            : rightHovered
                                                ? "inset -15px 0 0 0 #42a5f5"
                                                : "none",
                                }}
                            />
                        )}
                    </div>
                })}

                <DropArea width={100} height={"100%"}
                    onDropFiles={async (files) => { console.log(files) }}
                    onDropLocalFiles={(local_path) => { storyboard.addImage(local_path) }}
                >
                </DropArea>
            </PreviewStrip >
        </div >

        <MediaFolderGallery mediaFolder={storyboard} />

        <CollapsibleContainerAccordion label="Generate">
            <div className="p-2">
                <StoryBoardGenView storyboard={storyboard} />
                <TagsFolderContainer tags={storyboard.references} folders={[project, project.artbook as LocalFolder, storyboard.scene]} />

                <CollapsibleContainerAccordion label="ShotPrompts">
                    <div className="p-2">
                        <Accordion className='mb-2'>
                            {Object.entries(storyboard.shotPrompts).map(([key, _]: [string, string]) => (
                                <EditableJsonTextField
                                    key={key}
                                    localJson={storyboard.data}
                                    field={storyboard.fields.shot_prompts_dict + "/" + key}
                                    headerExtra={<>
                                        <Button size="sm" variant="success" onClick={() => {
                                            storyboard.generateImage(key);
                                        }}>Generate Image</Button>
                                    </>}
                                />

                            ))}
                        </Accordion>
                    </div>
                </CollapsibleContainerAccordion>
            </div>
        </CollapsibleContainerAccordion>

        <Button size="sm" onClick={() => {storyboard.createShotsFromStoryboard()}}>Create Shots</Button>
    </div >;
});


interface StoryBoardGenViewProps {
    storyboard: Storyboard;
}


export const StoryBoardGenView: React.FC<StoryBoardGenViewProps> = observer(({ storyboard }) => {
    const project = Project.getProject()


    return <div>
        <SettingsButton
            className="mb-2"
            buttons={
                <>
                    {/* Stylize Image Button */}
                    <button className="btn btn-sm btn-outline-success" onClick={async () => {

                        const workflow = project.workflows[storyboard.workflows.gen_shot_prompts] ?? ""
                        console.log("Model", workflow.model);
                        const prompt = `
            SCENE:
            ${storyboard.scene.script}

            ${workflow.prompt}            
            `

                        const res = await AI.GenerateText({
                            prompt: prompt,
                            model: workflow.model!,
                        })

                        await storyboard.data!.updateField(storyboard.fields.shot_prompts, res)
                        storyboard.createShotsFromDict();

                    }} >
                        Generate Storyboard Prompts
                    </button>

                    {/* Model Selector */}
                    <WorkflowOptionSelect
                        workflowName={storyboard.workflows.gen_shot_prompts}
                        optionName={"model"}
                        values={AllTextModels}
                    />

                    {/* Loading Spinner */}
                    <LoadingSpinner isLoading={false} asButton />
                </>
            }
            content={
                <>
                    <WorkflowTextField workflowName={storyboard.workflows.gen_shot_prompts} optionName={"prompt"} />
                    <EditableJsonTextField localJson={storyboard.data} field={storyboard.fields.shot_prompts} />
                    <Button onClick={() => { storyboard.createShotsFromDict(); }}>Create Shots</Button>
                </>
            }
        />




        <SettingsButton
            className="mb-2"
            buttons={
                <>
                    {/* Stylize Image Button */}
                    <button className="btn btn-sm btn-outline-success" onClick={async () => {


                    }} >
                        Generate Images
                    </button>

                    {/* Model Selector */}
                    <WorkflowOptionSelect
                        workflowName={storyboard.workflows.gen_images}
                        optionName={"model"}
                        values={AllImageModels}
                    />

                    <WorkflowOptionSelect
                        project={project}
                        workflowName={storyboard.workflows.gen_images}
                        optionName="aspect_ratio"
                        values={Object.values(GoogleAI.options.aspect_ratios)}
                        defaultValue={GoogleAI.options.aspect_ratios.r9x16}
                    />

                    {/* Loading Spinner */}
                    <LoadingSpinner isLoading={false} asButton />
                </>
            }
            content={
                <>
                    <WorkflowTextField workflowName={storyboard.workflows.gen_images} optionName={"prompt"} />
                    <EditableJsonTextField localJson={storyboard.data} field={storyboard.fields.gen_image_prompt} />
                </>
            }
        />




    </div>;
});

