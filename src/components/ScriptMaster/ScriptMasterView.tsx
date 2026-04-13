import { observer } from "mobx-react-lite";
import { Project } from "../../classes/Project";
import { Accordion, Badge, Button, Stack } from "react-bootstrap";
import { ModularScript } from "../../classes/ScriptMaster";
import { CollapsibleContainerAccordion } from "../Atomic/CollapsibleContainer";
import EditableJsonTextField, { EditableJsonToggleField } from "../EditableJsonTextField";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileCirclePlus, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import SettingsButton from "../Atomic/SettingsButton";
import { WorkflowOptionSelect, WorkflowTextField } from "../WorkflowOptionSelect";
import { AI, AllTextModels } from "../../classes/AI_provider";
import LoadingSpinner from "../Atomic/LoadingSpinner";


export const ScriptMasterView = observer(() => {
    const project = Project.getProject();
    const script = project.getByPath(project.selectedPath, ModularScript);

    if (!script) return null;

    const [episodeListName, episodeName, sceneName] = project.selectedSubPath.split("/");

    if (sceneName) {
        return <>
            <h2>
                <Badge bg="secondary">{script.name_no_extension}</Badge>:
                <Badge bg="secondary">{episodeListName}</Badge>.
                <Badge bg="secondary">{episodeName}</Badge>.
                <Badge bg="secondary">{sceneName}</Badge>
            </h2>
            <SceneView
                script={script}
                episodeListName={episodeListName}
                episodeName={episodeName}
                sceneName={sceneName}
            />
        </>
    }

    if (episodeName) {
        return <>
            <h2>
                <Badge bg="secondary">{script.name_no_extension}</Badge>:
                <Badge bg="secondary">{episodeListName}</Badge>.
                <Badge bg="secondary">{episodeName}</Badge>
            </h2>
            <EpisodeView
                script={script}
                episodeListName={episodeListName}
                episodeName={episodeName}
            />
        </>
    }

    if (episodeListName) {
        return <>
            <h2>
                <Badge bg="secondary">{script.name_no_extension}</Badge>:
                <Badge bg="secondary">{episodeListName}</Badge>
            </h2>
            <EpisodeListView
                script={script}
                episodeListName={episodeListName}
            />
        </>
    }



    return <div style={{ margin: "0px" }}>
        <h2><Badge bg="secondary">{script.name_no_extension}</Badge></h2>


        <EditableJsonTextField localJson={script} field="logline" label="Logline" />
        <GenerateLoglineView script={script} />
        <GenerateEpisodesView script={script} />
    </div>

});


type EpisodeListViewProps = {
    script: ModularScript;
    episodeListName: string;
};


export const EpisodeListView: React.FC<EpisodeListViewProps> = observer(({
    script,
    episodeListName,
}) => {
    const episodes = script.getEpisodes(episodeListName);

    return (
        <div style={{ marginLeft: 25 }}>
            <EditableJsonTextField
                label={"Описание Эпизодника"}
                localJson={script}
                field={`episode_lists/${episodeListName}/description`}
            />

            <Stack direction="horizontal" gap={3}>
                <h3><Badge>Episodes:</Badge></h3>
                <div className="ms-auto"><AddButton onClick={() => { script.addEpisode(episodeListName) }} /></div>
            </Stack>



            {Object.entries(episodes ?? {}).map(([episodeName]) => (
                <EditableJsonTextField
                    key={episodeName}
                    label={episodeName}
                    localJson={script}
                    field={`episode_lists/${episodeListName}/episodes/${episodeName}/description`}
                    headerExtra={
                        <DeleteButton
                            onClick={() => {
                                script.removeEpisode(episodeListName, episodeName);
                            }}
                        />
                    }
                />
            ))}
        </div>
    );
});

type EpisodeViewProps = {
    script: ModularScript;
    episodeListName: string;
    episodeName: string;
};


export const EpisodeView: React.FC<EpisodeViewProps> = observer(({
    script,
    episodeListName,
    episodeName,
}) => {
    const episode = script.getEpisodes(episodeListName)?.[episodeName];

    if (!episode) return null; // safety guard

    return (
        <div className="m-3">
            {false && (
                <div className="m-3">
                    {(episode.description ?? "no description")
                        .split("\n")
                        .map((line: string, i: number) => (
                            <div key={i}>{line}</div>
                        ))}
                </div>
            )}

            <EditableJsonTextField
                label={"description"}
                localJson={script}
                field={`episode_lists/${episodeListName}/episodes/${episodeName}/description`}
            />

            <GenerateScenesView
                script={script}
                episode={episodeName}
                episodeList={episodeListName}
            />

            <CollapsibleContainerAccordion
                label="Scenes"
                headerExtra={
                    <AddButton
                        onClick={() => {
                            script.addScene(episodeListName, episodeName);
                        }}
                    />
                }
            >
                <Accordion style={{ marginLeft: "15px" }} alwaysOpen>
                    {Object.entries(episode.scenes ?? {}).map(([sceneName]) => (
                        <>
                            <EditableJsonTextField
                                label={sceneName}
                                localJson={script}
                                field={`episode_lists/${episodeListName}/episodes/${episodeName}/scenes/${sceneName}/description`}
                                headerExtra={
                                    <DeleteButton onClick={() => { script.removeScene(episodeListName, episodeName, sceneName); }} />
                                }
                            />
                        </>
                    ))}
                </Accordion>
            </CollapsibleContainerAccordion>
        </div>
    );
});

type SceneViewProps = {
    script: ModularScript;
    episodeListName: string;
    episodeName: string;
    sceneName: string;
};

export const SceneView: React.FC<SceneViewProps> = ({
    script,
    episodeListName,
    episodeName,
    sceneName,
}) => {
    return (
        <div style={{ marginLeft: 25 }}>
            <GenerateSceneScriptView script={script} episode={episodeName} episodeList={episodeListName} sceneName={sceneName} />
            <EditableJsonTextField label="descriptions" localJson={script} field={`episode_lists/${episodeListName}/episodes/${episodeName}/scenes/${sceneName}/description`} />
            <EditableJsonTextField label="script" localJson={script} field={`episode_lists/${episodeListName}/episodes/${episodeName}/scenes/${sceneName}/script`} />
        </div>
    );
}

export type EpisodeList = {
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
                    <WorkflowTextField workflowName={wf_name} optionName={"prompt"} label="base_prompt" />
                    <EditableJsonTextField label={"prompt"} localJson={script} field={project.scriptmaster.fields.gen_logline} />
                    <EditableJsonTextField label={"result"} localJson={script} field={project.scriptmaster.fields.gen_logline_output} />
                </>
            }
        />
    </div>;
});

export const GenerateEpisodesView: React.FC<GenerateLoglineViewProps> = observer(({ script }) => {
    const project = Project.getProject()
    const wf_name = project.scriptmaster.workflows.gen_episodes;
    const scriptmaster = project.scriptmaster

    const model = project.workflows[project.scriptmaster.workflows.gen_logline].model ?? AllTextModels[0]

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
                            model: model,
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
                    <WorkflowTextField label={"base_prompt"} workflowName={wf_name} optionName={"prompt"} />
                    <EditableJsonTextField label={"prompt"} localJson={script} field={project.scriptmaster.fields.gen_episodes} />
                    <EditableJsonTextField label={"result"} localJson={script} field={project.scriptmaster.fields.gen_episodes_output} />

                    <Button size="sm" onClick={() => {
                        const src = script.getField(scriptmaster.fields.gen_episodes_output)
                        const clean = src.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
                        script.episodeLists = { ...JSON.parse(clean), ...script.episodeLists };
                        //script.updateField(scriptmaster.fields.episode_list, JSON.parse(clean))
                    }}>
                        Create Episode Lists
                    </Button>

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
    const model = project.workflows[project.scriptmaster.workflows.gen_logline].model ?? AllTextModels[0]


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
            ${script.getField(`episode_lists/${episodeList}/episodes/${episode}/description`)}


            ${script.getField(`episode_lists/${episodeList}/episodes/${episode}/gen_scenes_prompt`)}          
            `

                        const res = await AI.GenerateText({
                            prompt: prompt,
                            model: model,
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
                    <WorkflowTextField label="base prompt" workflowName={wf_name} optionName={"prompt"} />
                    <EditableJsonTextField label="user prompt" localJson={script} field={`episode_lists/${episodeList}/episodes/${episode}/gen_scenes_prompt`} />
                    <EditableJsonTextField label="result" localJson={script} field={gen_res_field} />

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
    sceneName: string,
}



export const GenerateSceneScriptView: React.FC<GenerateSceneScriptViewProps> = observer(({ script, episode, episodeList, sceneName }) => {
    const project = Project.getProject()
    const wf_name = project.scriptmaster.workflows.gen_scene_script;

    const gen_res_field = `episode_lists/${episodeList}/episodes/${episode}/scenes/${sceneName}/script`
    const gen_prompt_field = `episode_lists/${episodeList}/episodes/${episode}/scenes/${sceneName}/gen_script_prompt`
    const use_logline_field = `episode_lists/${episodeList}/episodes/${episode}/scenes/${sceneName}/gen_script_use_logline`
    const use_episode_desc_field = `episode_lists/${episodeList}/episodes/${episode}/scenes/${sceneName}/gen_script_use_desc`

    const model = project.workflows[project.scriptmaster.workflows.gen_logline].model ?? AllTextModels[0]

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


            ${script.getField(use_logline_field) ?
            `logline:
            ${script.getField("logline")}` : ""
                            }

            ${
            script.getField(use_episode_desc_field) ?
            `Episode description:
            ${script.getField(`episode_lists/${episodeList}/episodes/${episode}/description`)}` : ""
            }

            Scene description:
            ${script.getField(`episode_lists/${episodeList}/episodes/${episode}/scenes/${sceneName}/description`)}


            ${script.getField(gen_prompt_field)}          
            `

                        const res = await AI.GenerateText({
                            prompt: prompt,
                            model: model,
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
                    <EditableJsonToggleField label="Use Logline" localJson={script} field={use_logline_field} />
                    <EditableJsonToggleField label="Use Episode Description" localJson={script} field={use_episode_desc_field} />
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


