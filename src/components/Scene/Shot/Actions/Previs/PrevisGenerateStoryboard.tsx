
import type { Shot } from "../../../../../classes/Shot";
import { observer } from "mobx-react-lite";
import SettingsButton from "../../../../Atomic/SettingsButton";
import { WorkflowOptionSelect } from "../../../../WorkflowOptionSelect";
import { AI, AllImageModels } from "../../../../../classes/AI_provider";
import LoadingSpinner from "../../../../Atomic/LoadingSpinner";
import { LocalImage } from "../../../../../classes/fileSystem/LocalImage";
import { GoogleAI } from "../../../../../classes/GoogleAI";
import type { LocalFolder } from "../../../../../classes/fileSystem/LocalFolder";
import { Button } from "react-bootstrap";
import { downloadImageTiles, splitImageIntoTiles } from "./ImageSplitUtils";
import SimpleSelect from "../../../../Atomic/SimpleSelect";
import EditableJsonTextField, { EditableJsonToggleButton } from "../../../../EditableJsonTextField";

interface Props {
    shot: Shot;
    use_shots_json?: boolean;
}

const wf_name = "shot_previs_generate_storyboard"
const wf_loading = `${wf_name}/loading`


const use_prev_shot_field = `workflows/${wf_name}/use_prev_shot_field`
const get_use_prev_shot = (shot: Shot | null) => {
    if (!shot) return false;
    return shot.shotJson?.getField(use_prev_shot_field);
}
const UsePrevShotToggle: React.FC<Props> = observer(({ shot }) => {
    return <>{shot.prevShot &&
        <EditableJsonToggleButton localJson={shot.shotJson} field={use_prev_shot_field} label="Use Prev Shot" />
    }</>;
})

// Prompt
const wf_prompt_field = `workflows/${wf_name}/prompt`
const wf_prompt_field_prev = `workflows/${wf_name}/prompt_prev`
const PromptField: React.FC<Props> = observer(({ shot }) => {
    return <>
        <EditableJsonTextField localJson={shot.scene.project.projinfo} field={get_use_prev_shot(shot) ? wf_prompt_field_prev : wf_prompt_field} />
    </>;
})
const get_prompt = (shot: Shot): string => {
    return shot.scene.project.projinfo?.getField(get_use_prev_shot(shot) ? wf_prompt_field_prev : wf_prompt_field);
}




const component: React.FC<Props> = observer(({ shot,use_shots_json = false }) => {
    const loading = shot.shotJson?.getField(wf_loading) ?? false;
    const project = shot.scene.project;

    const rows = project.projinfo?.getField(`workflows/${wf_name}/x_rows`) ?? "4"
    const cols = project.projinfo?.getField(`workflows/${wf_name}/y_rows`) ?? "4"

    return <div>
        <SettingsButton
            className="mb-2"
            buttons={
                <>
                    <button className="btn btn-sm btn-outline-success"
                        onClick={async () => {
                            console.log("Generate Staging Dscription");
                            Action_Previs_Generate_Storyboard(shot,use_shots_json);
                        }} >
                        Generate Storyboard
                    </button>

                    {/* Model Selector */}
                    <WorkflowOptionSelect
                        workflowName={wf_name}
                        optionName={"model"}
                        values={AllImageModels}
                    />

                    <WorkflowOptionSelect
                        project={project}
                        workflowName={wf_name}
                        optionName="aspect_ratio"
                        values={Object.values(GoogleAI.options.aspect_ratios)}
                        defaultValue={GoogleAI.options.aspect_ratios.r9x16}
                    />

                    <WorkflowOptionSelect
                        project={project}
                        workflowName={wf_name}
                        optionName="resolution"
                        values={Object.values(GoogleAI.options.resolution)}
                        defaultValue={GoogleAI.options.resolution.none}
                    />

                    <UsePrevShotToggle shot={shot} />

                    <LoadingSpinner isLoading={loading} asButton />


                    {false && <>
                        <Button size="sm"
                            variant="outline-warning"
                            onClick={async () => {
                                if (!shot.first_frame || !(shot.first_frame instanceof LocalImage)) {
                                    console.log("Please Select firts frame");
                                    return;
                                }
                                const tiles = await splitImageIntoTiles(shot.first_frame, Number(rows), Number(cols));
                                await downloadImageTiles(tiles, `${shot.scene.project.name}_${shot.scene.name}_${shot.name}`);

                            }}>Split Into Tiles</Button>

                        <SimpleSelect options={["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]}
                            value={rows}
                            label="Rows/Columns:"
                            onChange={(val) => {
                                project.projinfo?.updateField(`workflows/${wf_name}/x_rows`, val)
                            }} />
                        <SimpleSelect options={["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]}
                            value={cols}
                            onChange={(val) => {
                                project.projinfo?.updateField(`workflows/${wf_name}/y_rows`, val)
                            }} />
                    </>}

                </>
            }
            content={
                <>
                    <PromptField shot={shot} />
                </>
            }
        />
    </div >
})

export async function Action_Previs_Generate_Storyboard(shot: Shot, use_shotjson = false) {
    shot.shotJson?.updateField(wf_loading, true);

    try {
        const workflow = shot.scene.project.workflows[wf_name];

        const messages = get_use_prev_shot(shot) ? [
            "Описание шотов прошлой сцены сцены:",
            use_shotjson ?
                shot.prevShot?.shotJson?.getField("previs_json") as string
                :
                shot.prevShot?.shotJson?.getField("previs_shots") as string,
            `@image1 - раскадровка прошлой сцены:           

            ----------------------------------------------------
            
            Твоя текущая задача:

            `,
            shot.prevShot?.srcImage ?? "",
            get_prompt(shot) ?? "",
            `
                      
            
            Описания шотов для текущей сцены:`,
            use_shotjson ?
                shot.shotJson?.data.previs_json as string
                :
                shot.shotJson?.data.previs_shots as string,
        ] : [
            "Описания шотов:",
            use_shotjson ?
                shot.shotJson?.data.previs_json as string
                :
                shot.shotJson?.data.previs_shots as string,
            get_prompt(shot) ?? "",
            //"Сценарий:",
            //shot.shotJson?.data.previs_script as string,
        ]
        console.log("SPLIT MESSAGES:", messages);

        const res = await AI.sendMessages(
            messages,
            workflow.model ?? AllImageModels[0],
            workflow.aspect_ratio,
            workflow.resolution,
        );

        const localImage: LocalImage | null =
            await GoogleAI.saveResultImage(
                res,
                shot.MediaFolder_results as LocalFolder,
            );

        return localImage;
    } finally {
        shot.shotJson?.updateField(wf_loading, false);
    }
}

export const WF_Previs_GenerateStoryboard = {
    wf_name,
    wf_loading,
    component,
}






