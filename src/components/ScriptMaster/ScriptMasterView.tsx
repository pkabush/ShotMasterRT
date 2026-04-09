import { observer } from "mobx-react-lite";
import { Project } from "../../classes/Project";
import { Accordion, Badge, Button } from "react-bootstrap";
import { ModularScript } from "../../classes/ScriptMaster";
import { CollapsibleAccordionCard, CollapsibleContainerAccordion } from "../Atomic/CollapsibleContainer";
import EditableJsonTextField from "../EditableJsonTextField";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileCirclePlus, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import TabsContainer from "../TabsContainer";
import SettingsButton from "../Atomic/SettingsButton";
import { WorkflowOptionSelect, WorkflowTextField } from "../WorkflowOptionSelect";
import { AI, AllTextModels } from "../../classes/AI_provider";
import LoadingSpinner from "../Atomic/LoadingSpinner";




export const ScriptMasterView = observer(() => {
    const project = Project.getProject();
    //const data = project.promptinfo;
    //const scriptmaster = project.getType(ScriptMaster)[0];

    const script = project.getByPath(project.selectedPath, ModularScript);
    const scriptmaster = project.scriptmaster


    if (!script) return null;



    return <div style={{ margin: "0px" }}>
        <h2><Badge bg="secondary">{script.name_no_extension}</Badge></h2>

        <TabsContainer tabs={{
            Description: <>
                <EditableJsonTextField localJson={script} field="logline" label="Logline"/>
                <GenerateLoglineView script={script} />
                <GenerateEpisodesView script={script} />

            </>,

            Episodes: <>
                <AddButton onClick={() => { script.addEpisodeList(); }} />
                <Accordion >
                    {Object.entries(script.getField(scriptmaster.fields.episode_list) as Record<string, EpisodeList> ?? {}).map(([episodeListName, episodeList]) => {

                        return <CollapsibleAccordionCard key={episodeListName} label={episodeListName} headerExtra={
                            <DeleteButton onClick={() => {
                                script.removeEpisodeList(episodeListName);
                            }} />
                        }>
                            < div style={{ marginLeft: 25 }}>
                                {episodeList.description ?? "no description"}

                                {false && <>
                                    <EditableJsonTextField localJson={script} field={`episode_lists/${episodeListName}/description`} />
                                </>}

                                <CollapsibleContainerAccordion label="Episodes" headerExtra={
                                    <AddButton onClick={() => { script.addEpisode(episodeListName) }} />
                                }>
                                    <Accordion alwaysOpen defaultActiveKey={Object.keys(episodeList.episodes ?? {})}>
                                        {Object.entries(episodeList.episodes ?? {}).map(([episodeName, episode]) => (

                                            <CollapsibleAccordionCard label={episodeName} key={episodeName} headerExtra={
                                                <DeleteButton onClick={() => { script.removeEpisode(episodeListName, episodeName) }} />
                                            }>

                                                <div className="m-3">

                                                    {false &&
                                                        <div className="m-3">
                                                            {(episode.description ?? "no description").split("\n")
                                                                .map((line: string, i: number) => (<div key={i}>{line}</div>))}
                                                        </div>}

                                                    <EditableJsonTextField label={"description"} localJson={script} field={`episode_lists/${episodeListName}/episodes/${episodeName}/description`} />



                                                    <CollapsibleContainerAccordion
                                                        label="Scenes"
                                                        headerExtra={<AddButton onClick={() => { script.addScene(episodeListName, episodeName) }} />
                                                        }>
                                                        <GenerateScenesView script={script} episode={episodeName} episodeList={episodeListName} />

                                                        <Accordion style={{ marginLeft: "15px" }} alwaysOpen>
                                                            {Object.entries(episode.scenes ?? {}).map(([sceneName, _]) => (
                                                                <CollapsibleAccordionCard label={sceneName} key={sceneName} headerExtra={
                                                                    <DeleteButton onClick={() => { script.removeScene(episodeListName, episodeName, sceneName) }} />
                                                                }>
                                                                    <div style={{ marginLeft: 25 }}>
                                                                        <GenerateSceneScriptView  script={script} episode={episodeName} episodeList={episodeListName} sceneName={sceneName}/>
                                                                        <EditableJsonTextField label="descriptions" localJson={script} field={`episode_lists/${episodeListName}/episodes/${episodeName}/scenes/${sceneName}/description`} />
                                                                        <EditableJsonTextField label="script" localJson={script} field={`episode_lists/${episodeListName}/episodes/${episodeName}/scenes/${sceneName}/script`} />
                                                                    </div>
                                                                </CollapsibleAccordionCard>

                                                            ))}
                                                        </Accordion>
                                                    </CollapsibleContainerAccordion>
                                                </div>
                                            </CollapsibleAccordionCard>
                                        ))}
                                    </Accordion>
                                </CollapsibleContainerAccordion>
                            </div>
                        </CollapsibleAccordionCard>
                    })}
                </Accordion>



            </>
        }} />
    </div>

});


type EpisodeList = {
    description: string;
    episodes: Record<string, any>;
};




export const DeleteButton = ({ onClick }: { onClick: () => void }) => {
    return (
        <Button size="sm" variant="outline-danger" onClick={onClick}>
            <FontAwesomeIcon icon={faTrashCan} />
        </Button>
    );
};

export const AddButton = ({ onClick }: { onClick: () => void }) => {
    return (
        <Button size="sm" variant="outline-success" onClick={onClick}>
            <FontAwesomeIcon icon={faFileCirclePlus} />
        </Button>
    );
};




interface GenerateLoglineViewProps {
    script: ModularScript;
}


export const GenerateLoglineView: React.FC<GenerateLoglineViewProps> = observer(({ script }) => {
    const project = Project.getProject()
    const wf_name = project.scriptmaster.workflows.gen_logline;
    const scriptmaster = project.scriptmaster

    return <div>
        <SettingsButton
            className="mb-2"
            buttons={
                <>
                    {/* Stylize Image Button */}
                    <button className="btn btn-sm btn-outline-success" onClick={async () => {


                        const workflow = project.workflows[wf_name] ?? ""
                        const prompt = `
            ${workflow.prompt}  


            ${script.getField(scriptmaster.fields.gen_logline)}          
            `

                        const res = await AI.GenerateText({
                            prompt: prompt,
                            model: workflow.model ?? AllTextModels[0],
                        })

                        script.updateField(scriptmaster.fields.gen_logline_output, res)

                    }} >
                        Generate Logline And Synosys
                    </button>

                    {/* Model Selector */}
                    <WorkflowOptionSelect
                        workflowName={wf_name}
                        optionName={"model"}
                        values={AllTextModels}
                    />

                    {/* Loading Spinner */}
                    <LoadingSpinner isLoading={false} asButton />
                </>
            }
            content={
                <>
                    <WorkflowTextField workflowName={wf_name} optionName={"prompt"} />
                    <EditableJsonTextField localJson={script} field={project.scriptmaster.fields.gen_logline} />
                    <EditableJsonTextField localJson={script} field={project.scriptmaster.fields.gen_logline_output} />
                </>
            }
        />
    </div>;
});

export const GenerateEpisodesView: React.FC<GenerateLoglineViewProps> = observer(({ script }) => {
    const project = Project.getProject()
    const wf_name = project.scriptmaster.workflows.gen_episodes;
    const scriptmaster = project.scriptmaster

    return <div>
        <SettingsButton
            className="mb-2"
            buttons={
                <>
                    {/* Stylize Image Button */}
                    <button className="btn btn-sm btn-outline-success" onClick={async () => {


                        const workflow = project.workflows[wf_name] ?? ""
                        const prompt = `
            ${workflow.prompt}  


            logline:
            ${script.getField("logline")}   
            synopsys:
            ${script.getField("synopsys")}  


            ${script.getField(scriptmaster.fields.gen_episodes)}          
            `

                        const res = await AI.GenerateText({
                            prompt: prompt,
                            model: workflow.model ?? AllTextModels[0],
                        })

                        if (!res) return;
                        script.updateField(scriptmaster.fields.gen_episodes_output, res)
                        //const clean = res.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
                        //script.updateField(scriptmaster.fields.gen_episodes_output_json, JSON.parse(clean))

                    }} >
                        Generate Episodes
                    </button>

                    {/* Model Selector */}
                    <WorkflowOptionSelect
                        workflowName={project.scriptmaster.workflows.gen_logline}
                        optionName={"model"}
                        values={AllTextModels}
                    />

                    {/* Loading Spinner */}
                    <LoadingSpinner isLoading={false} asButton />
                </>
            }
            content={
                <>
                    <Button size="sm" onClick={() => {
                        const src = script.getField(scriptmaster.fields.gen_episodes_output)
                        const clean = src.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
                        script.episodeLists = { ...JSON.parse(clean), ...script.episodeLists };
                        //script.updateField(scriptmaster.fields.episode_list, JSON.parse(clean))
                    }}>
                        Create Episode Lists
                    </Button>
                    <WorkflowTextField workflowName={wf_name} optionName={"prompt"} />
                    <EditableJsonTextField localJson={script} field={project.scriptmaster.fields.gen_episodes} />
                    <EditableJsonTextField localJson={script} field={project.scriptmaster.fields.gen_episodes_output} />

                </>
            }
        />
    </div>;
});


interface GenerateScenesViewProps {
    script: ModularScript;
    episode: string;
    episodeList: string,
}


export const GenerateScenesView: React.FC<GenerateScenesViewProps> = observer(({ script, episode, episodeList }) => {
    const project = Project.getProject()
    const wf_name = project.scriptmaster.workflows.gen_scenes;

    const gen_res_field = `episode_lists/${episodeList}/episodes/${episode}/gen_scenes_output`

    return <div>
        <SettingsButton
            className="mb-2"
            buttons={
                <>
                    {/* Stylize Image Button */}
                    <button className="btn btn-sm btn-outline-success" onClick={async () => {


                        const workflow = project.workflows[wf_name] ?? ""
                        const prompt = `
            ${workflow.prompt}  


            logline:
            ${script.getField("logline")}   
            synopsys:
            ${script.getField("synopsys")}  


            Episode description:
            ${ script.getField(`episode_lists/${episodeList}/episodes/${episode}/description`) }


            ${script.getField(`episode_lists/${episodeList}/episodes/${episode}/gen_scenes_prompt`)}          
            `

                        const res = await AI.GenerateText({
                            prompt: prompt,
                            model: workflow.model ?? AllTextModels[0],
                        })

                        if (!res) return;
                        script.updateField(gen_res_field, res)

                    }} >
                        Generate Scenes
                    </button>

                    {/* Model Selector */}
                    <WorkflowOptionSelect
                        workflowName={project.scriptmaster.workflows.gen_logline}
                        optionName={"model"}
                        values={AllTextModels}
                    />

                    {/* Loading Spinner */}
                    <LoadingSpinner isLoading={false} asButton />
                </>
            }
            content={
                <>
                    <WorkflowTextField workflowName={wf_name} optionName={"prompt"} />
                    <EditableJsonTextField localJson={script} field={`episode_lists/${episodeList}/episodes/${episode}/gen_scenes_prompt`} />
                    <EditableJsonTextField localJson={script} field={gen_res_field} />

                    <Button size="sm" onClick={() => {
                        const src = script.getField(gen_res_field)
                        const clean = src.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

                        const scenes_field = `episode_lists/${episodeList}/episodes/${episode}/scenes`

                        script.updateField(scenes_field, { ...JSON.parse(clean), ...script.getField(scenes_field) });
                        //script.updateField(scriptmaster.fields.episode_list, JSON.parse(clean))
                    }}>
                        Create Scenes from list
                    </Button>

                </>
            }
        />
    </div>;
});


interface GenerateSceneScriptViewProps {
    script: ModularScript;
    episode: string;
    episodeList: string,
    sceneName:string,
}



export const GenerateSceneScriptView: React.FC<GenerateSceneScriptViewProps> = observer(({ script, episode, episodeList,sceneName }) => {
    const project = Project.getProject()
    const wf_name = project.scriptmaster.workflows.gen_scene_script;

    const gen_res_field = `episode_lists/${episodeList}/episodes/${episode}/scenes/${sceneName}/script`
    const gen_prompt_field = `episode_lists/${episodeList}/episodes/${episode}/scenes/${sceneName}/gen_script_prompt`

    return <div>
        <SettingsButton
            className="mb-2"
            buttons={
                <>
                    {/* Stylize Image Button */}
                    <button className="btn btn-sm btn-outline-success" onClick={async () => {


                        const workflow = project.workflows[wf_name] ?? ""
                        const prompt = `
            ${workflow.prompt}  


            logline:
            ${script.getField("logline")}   
            synopsys:
            ${script.getField("synopsys")}  


            Episode description:
            ${ script.getField(`episode_lists/${episodeList}/episodes/${episode}/description`) }

            Scene description:
            ${ script.getField(`episode_lists/${episodeList}/episodes/${episode}/scenes/${sceneName}/description`) }


            ${script.getField(gen_prompt_field) }          
            `

                        const res = await AI.GenerateText({
                            prompt: prompt,
                            model: workflow.model ?? AllTextModels[0],
                        })

                        if (!res) return;
                        script.updateField(gen_res_field, res)

                    }} >
                        Generate Script
                    </button>

                    {/* Model Selector */}
                    <WorkflowOptionSelect
                        workflowName={project.scriptmaster.workflows.gen_logline}
                        optionName={"model"}
                        values={AllTextModels}
                    />

                    {/* Loading Spinner */}
                    <LoadingSpinner isLoading={false} asButton />
                </>
            }
            content={
                <>
                    <WorkflowTextField workflowName={wf_name} optionName={"prompt"} />
                    <EditableJsonTextField label={"Prompt"} localJson={script} field={gen_prompt_field} />

                </>
            }
        />
    </div>;
});



export const test = {
    "Episode Name": {
        "description": "короткое описние",
        "episodes": {
            "Episode_1": "episode_description",
            "Episode_2": "episode_description",
            "Episode_3": "episode_description",

        }
    },
}


