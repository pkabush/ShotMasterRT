import { observer } from "mobx-react-lite";
import { Project } from "../../classes/Project";
import { Accordion, Badge, Button, ButtonGroup } from "react-bootstrap";
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
        <GenerateEpisodesTextView script={script} />
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
    const show_scenes_field = `episode_lists/${episodeListName}/show_scenes`;

    return (
        <div style={{ marginLeft: 25 }}>

            <EditableJsonTextField
                label={"Эпизодник"}
                localJson={script}
                field={`episode_lists/${episodeListName}/text`}
                collapsed={true}
                onSave={() => { script.createEpisodesFromEpisodeList(episodeListName); }}
            />

            <Button size="sm" variant="success" onClick={() => {
                script.generateAllSceneDescriptions(episodeListName);
            }}> Generate All Scenes</Button>

            <CollapsibleContainerAccordion label="Episodes" headerExtra={<>

                {false && <Button size="sm" onClick={() => {
                    script.createEpisodeListFromEpisodes(episodeListName);
                }}> Sync </Button>}

                <ButtonGroup >


                    <EditableJsonToggleField localJson={script} field={show_scenes_field} label="Show Scenes" default_val={false} />

                    <AddButton onClick={() => { script.addEpisode(episodeListName) }} />
                </ButtonGroup>

            </>}>
                {Object.entries(episodes ?? {}).map(([episodeName]) => (
                    <div key={episodeName}>
                        {
                            script.getField(show_scenes_field) ?
                                <EpisodeView
                                    script={script}
                                    episodeListName={episodeListName}
                                    episodeName={episodeName}
                                    show_gen_button={false}
                                    full_names={true}
                                />
                                :
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
                                    onSave={() => { script.createEpisodeListFromEpisodes(episodeListName) }}
                                />}
                    </div>
                ))}
            </CollapsibleContainerAccordion>

            <Button size="sm" variant="success" onClick={() => {
                //script.generateAllSceneScripts(episodeListName);
                script.generateAllEpisodeScripts(episodeListName);

            }}> Generate Script</Button>

            {/** 
            <CollapsibleContainerAccordion label="Script" defaultCollapsed={true} headerExtra={<>
                <Button
                    size="sm"
                    onClick={async () => {
                        const fullScript = Object.entries(episodes ?? {})
                            .map(([episodeName], episodeIndex) => {
                                const epNumber = episodeIndex + 1;
                                const episodeHeader = `EPISODE_${epNumber}`;

                                const scenes = Object.entries(
                                    script.getScenes(episodeListName, episodeName) ?? {}
                                )
                                    .map(([sceneName], sceneIndex) => {
                                        const scNumber = sceneIndex + 1;

                                        const sceneScript = script.getField(
                                            `episode_lists/${episodeListName}/episodes/${episodeName}/scenes/${sceneName}/script`
                                        );

                                        return `SC_${epNumber}_${scNumber}\n${sceneScript}`;
                                    })
                                    .join("\n\n");

                                return `${episodeHeader}\n\n${scenes}`;
                            })
                            .join("\n\n");

                        await navigator.clipboard.writeText(fullScript);
                        alert("Copied!");
                    }}
                >
                    copy Full Script
                </Button>

            </>}>
                {Object.entries(episodes ?? {}).map(([episodeName]) => {
                    return <div key={episodeName}>
                        <h4><Badge bg="secondary"> {episodeName}</Badge></h4>
                        {Object.entries(script.getScenes(episodeListName, episodeName) ?? {}).map(([sceneName]) => (
                            <EditableJsonTextField
                                key={sceneName}
                                label={sceneName}
                                localJson={script}
                                field={`episode_lists/${episodeListName}/episodes/${episodeName}/scenes/${sceneName}/script`}
                                maxHeight="6000px"
                            />
                        ))}

                    </div>
                })}
            </CollapsibleContainerAccordion>
*/}
            <CollapsibleContainerAccordion label="Script" defaultCollapsed={true} headerExtra={<>
                <Button
                    size="sm"
                    onClick={async () => {
                        const fullScript = Object.entries(episodes ?? {})
                            .map(([episodeName], episodeIndex) => {
                                const epNumber = episodeIndex + 1;
                                const episodeHeader = `EPISODE_${epNumber}`;

                                /*
                                const scenes = Object.entries(
                                    script.getScenes(episodeListName, episodeName) ?? {}
                                )
                                    .map(([sceneName], sceneIndex) => {
                                        const scNumber = sceneIndex + 1;

                                        const sceneScript = script.getField(
                                            `episode_lists/${episodeListName}/episodes/${episodeName}/scenes/${sceneName}/script`
                                        );

                                        return `SC_${epNumber}_${scNumber}\n${sceneScript}`;
                                    })
                                    .join("\n\n");

                                

                                return `${episodeHeader}\n\n${scenes}`;
                                */
                                const epScript = script.getField(
                                    `episode_lists/${episodeListName}/episodes/${episodeName}/script`
                                );
                                return `${episodeHeader}\n\n${epScript}`;
                            })
                            .join("\n\n");

                        await navigator.clipboard.writeText(fullScript);
                        alert("Copied!");
                    }}
                >
                    copy Full Script
                </Button>

            </>}>
                {Object.entries(episodes ?? {}).map(([episodeName]) => {
                    return <div key={episodeName}>

                        <EditableJsonTextField
                            key={episodeName}
                            label={episodeName}
                            localJson={script}
                            field={`episode_lists/${episodeListName}/episodes/${episodeName}/script`}
                            maxHeight="6000px"
                        />

                    </div>
                })}
            </CollapsibleContainerAccordion>



        </div >
    );
});

type EpisodeViewProps = {
    script: ModularScript;
    episodeListName: string;
    episodeName: string;
    show_gen_button?: boolean;
    full_names?: boolean;
};


export const EpisodeView: React.FC<EpisodeViewProps> = observer(({
    script,
    episodeListName,
    episodeName,
    show_gen_button = true,
    full_names = false,
}) => {
    const episode = script.getEpisodes(episodeListName)?.[episodeName];
    if (!episode) return null; // safety guard
    const show_gen_button_field = `episode_lists/${episodeListName}/episodes/${episodeName}/show_gen`

    const scenes_field = `episode_lists/${episodeListName}/episodes/${episodeName}/gen_scenes_output`

    // for spinner
    const gen_res_field = `episode_lists/${episodeListName}/episodes/${episodeName}/gen_scenes_output`
    const gen_id = `${script.path}#${gen_res_field}`

    const project = Project.getProject();

    const ep_script_field = `episode_lists/${episodeListName}/episodes/${episodeName}/script`

    return (
        <div className="m-3">
            {false && (
                <div className="m-3">
                    {((episode as any).description ?? "no description")
                        .split("\n")
                        .map((line: string, i: number) => (
                            <div key={i}>{line}</div>
                        ))}
                </div>
            )}

            <EditableJsonTextField
                label={full_names ? episodeName : "description"}
                localJson={script}
                field={`episode_lists/${episodeListName}/episodes/${episodeName}/description`}
                headerExtra={
                    <>
                        <LoadingSpinner isLoading={script.generating.isGenerating(gen_id)} asButton />
                        {!show_gen_button && <EditableJsonToggleField default_val={false} localJson={script} field={show_gen_button_field} label="GEN" />}
                    </>
                }
                onSave={() => { script.createEpisodeListFromEpisodes(episodeListName) }}
            />

            {(show_gen_button || script.getField(show_gen_button_field)) &&
                <GenerateScenesView
                    script={script}
                    episode={episodeName}
                    episodeList={episodeListName}
                />}

            <CollapsibleContainerAccordion
                openColor="#8d5a6e"
                closedColor="rgb(68, 51, 65)"
                label={full_names ? `${episodeName} : SCENES` : "SCENES"}
                headerExtra={
                    <>
                        <ButtonGroup>
                            {false && <EditableJsonToggleField localJson={project.projinfo} field="ui/scriptmaster/split_scenes" label="Split" default_val={false} />}

                            <AddButton
                                onClick={() => {
                                    script.addScene(episodeListName, episodeName);
                                }}
                            />
                        </ButtonGroup>
                    </>
                }
            >
                {project.projinfo?.getField("ui/scriptmaster/split_scenes") && false ?
                    <Accordion style={{ marginLeft: "15px" }} alwaysOpen>
                        {Object.entries((episode as any).scenes ?? {}).map(([sceneName]) => (
                            <div key={sceneName}>
                                <EditableJsonTextField
                                    label={`${episodeName} - ${sceneName}`}
                                    localJson={script}
                                    field={`episode_lists/${episodeListName}/episodes/${episodeName}/scenes/${sceneName}/description`}
                                    headerExtra={
                                        <DeleteButton onClick={() => { script.removeScene(episodeListName, episodeName, sceneName); }} />
                                    }
                                    openColor="#764056"
                                    closedColor="rgb(71, 36, 64)"
                                    onSave={() => {
                                        script.createScenesTextFromScenes(episodeListName, episodeName);
                                    }}
                                />
                            </div>
                        ))}
                    </Accordion> :
                    <div style={{ marginLeft: "15px" }} >
                        <EditableJsonTextField
                            localJson={script}
                            field={scenes_field}
                            openColor="#764056"
                            closedColor="rgb(71, 36, 64)"
                            onSave={() => {
                                script.createScenesFromScenesText(episodeListName, episodeName);
                            }} />

                        <GenerateEpisodeScript episodeList={episodeListName} episode={episodeName} script={script} />

                        <EditableJsonTextField
                            localJson={script}
                            field={ep_script_field}
                            label={`${episodeName} : SCRIPT`}
                            maxHeight="10000px"
                            openColor="#a98340"
                            closedColor="#68522a" />

                    </div>
                }



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
    const gen_id = `${script.path}#gen_logline`

    return <div>
        <SettingsButton
            className="mb-2"
            buttons={
                <>
                    {/* Stylize Image Button */}
                    <button className="btn btn-sm btn-outline-success" onClick={async () => {

                        script.generating.add(gen_id)

                        try {
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
                        }
                        catch (err) {
                            console.error("Generation failed:", err);
                        } finally {
                            script.generating.remove(gen_id);
                        }

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
                    <LoadingSpinner isLoading={script.generating.isGenerating(gen_id)} asButton />
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


export const GenerateEpisodesTextView: React.FC<GenerateLoglineViewProps> = observer(({ script }) => {
    const project = Project.getProject()
    const wf_name = project.scriptmaster.workflows.gen_episodes_text;
    const scriptmaster = project.scriptmaster

    const model = project.workflows[project.scriptmaster.workflows.gen_logline].model ?? AllTextModels[0]
    const gen_id = `${script.path}#gen_episodes_text`

    return <div>
        <SettingsButton
            className="mb-2"
            buttons={
                <>
                    {/* Stylize Image Button */}
                    <button className="btn btn-sm btn-outline-success" onClick={async () => {

                        script.generating.add(gen_id)

                        try {
                            const workflow = project.workflows[wf_name] ?? ""
                            const prompt = `
            ${workflow.prompt}  


            ${script.getField("logline")}   

            ${script.getField(scriptmaster.fields.gen_episodes_text) ?? ""}          
            `

                            const res = await AI.GenerateText({
                                prompt: prompt,
                                model: model,
                            })

                            if (!res) return;
                            script.updateField(scriptmaster.fields.gen_episodes_text_output, res)

                            script.episodeLists = { ...script.episodeLists, ...{ "Variant_1": { text: res } } };
                            script.createEpisodesFromEpisodeList("Variant_1");
                            script.createEpisodeListFromEpisodes("Variant_1");

                        }
                        catch (err) {
                            console.error("Generation failed:", err);
                        } finally {
                            script.generating.remove(gen_id);
                        }
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
                    <LoadingSpinner isLoading={script.generating.isGenerating(gen_id)} asButton />
                </>
            }
            content={
                <>
                    <WorkflowTextField label={"base_prompt"} workflowName={wf_name} optionName={"prompt"} />
                    <EditableJsonTextField label={"prompt"} localJson={script} field={project.scriptmaster.fields.gen_episodes_text} />
                    <EditableJsonTextField label={"result"} localJson={script} field={project.scriptmaster.fields.gen_episodes_text_output} />
                    <Button size="sm" onClick={() => {
                        const src = script.getField(scriptmaster.fields.gen_episodes_text_output)
                        script.episodeLists = { ...script.episodeLists, ...{ "Variant_1": { text: src } } };

                    }}>
                        Add Episode Lists
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
    const gen_id = `${script.path}#${gen_res_field}`

    return <div>
        <SettingsButton
            className="mb-2"
            buttons={
                <>
                    {/* Stylize Image Button */}
                    <button className="btn btn-sm btn-outline-success" onClick={async () => {
                        script.generateSceneDescriptions(episodeList, episode, true);
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
                    <LoadingSpinner isLoading={script.generating.isGenerating(gen_id)} asButton />
                </>
            }
            content={
                <>
                    <WorkflowTextField label="base prompt" workflowName={wf_name} optionName={"prompt"} />
                    <EditableJsonTextField
                        label="user prompt"
                        localJson={script}
                        field={`episode_lists/${episodeList}/episodes/${episode}/gen_scenes_prompt`}

                    //default_value={project.promptinfo?.getOrCreateField(
                    //    "script/contents/generate_scenes_preset",
                    //    { type: "string", contents: "Место и Время:\nНастроение:" }).contents ?? ""}
                    />
                    <EditableJsonTextField label="result" localJson={script} field={gen_res_field} />

                    <Button size="sm" onClick={() => { script.createScenesFromScenesText(episodeList, episode); }}>
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

    const gen_id = `${script.path}#${gen_res_field}`

    return <div>
        <SettingsButton
            className="mb-2"
            buttons={
                <>
                    {/* Stylize Image Button */}
                    <button className="btn btn-sm btn-outline-success" onClick={async () => {

                        script.generateSceneScript(episodeList, episode, sceneName);
                        return;
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
                    <LoadingSpinner isLoading={script.generating.isGenerating(gen_id)} asButton />
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





interface GenerateEpisodeScriptViewProps {
    script: ModularScript;
    episode: string;
    episodeList: string,
}



export const GenerateEpisodeScript: React.FC<GenerateEpisodeScriptViewProps> = observer(({ script, episode, episodeList }) => {
    const project = Project.getProject()
    const wf_name = project.scriptmaster.workflows.gen_scene_script;

    const gen_res_field = `episode_lists/${episodeList}/episodes/${episode}/script`
    const gen_prompt_field = `episode_lists/${episodeList}/episodes/${episode}/gen_script_prompt`
    const use_logline_field = `episode_lists/${episodeList}/episodes/${episode}/gen_script_use_logline`
    const use_episode_desc_field = `episode_lists/${episodeList}/episodes/${episode}/gen_script_use_desc`

    const gen_id = `${script.path}#${gen_res_field}`

    return <div>
        <SettingsButton
            className="mb-2"
            buttons={
                <>
                    {/* Stylize Image Button */}
                    <button className="btn btn-sm btn-outline-success" onClick={async () => {

                        script.generateEpisodeScript(episodeList, episode);
                        return;
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
                    <LoadingSpinner isLoading={script.generating.isGenerating(gen_id)} asButton />
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





