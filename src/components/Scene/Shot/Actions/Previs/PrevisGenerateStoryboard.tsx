
import type { Shot } from "../../../../../classes/Shot";
import { observer } from "mobx-react-lite";
import SettingsButton from "../../../../Atomic/SettingsButton";
import { WorkflowOptionSelect, WorkflowTextField } from "../../../../WorkflowOptionSelect";
import { AI, AllImageModels } from "../../../../../classes/AI_provider";
import LoadingSpinner from "../../../../Atomic/LoadingSpinner";
import { LocalImage } from "../../../../../classes/fileSystem/LocalImage";
import { GoogleAI } from "../../../../../classes/GoogleAI";
import type { LocalFolder } from "../../../../../classes/fileSystem/LocalFolder";
import { Button } from "react-bootstrap";
import { downloadImageTiles, splitImageIntoTiles } from "./ImageSplitUtils";
import SimpleSelect from "../../../../Atomic/SimpleSelect";

interface Props {
    shot: Shot;
}

const wf_name = "shot_previs_generate_storyboard"
const wf_loading = `${wf_name}/loading`


const component: React.FC<Props> = observer(({ shot }) => {
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
                            Action_Previs_Generate_Storyboard(shot);
                        }} >
                        Generate Storyboard
                    </button>

                    {/* Model Selector */}
                    <WorkflowOptionSelect
                        workflowName={wf_name}
                        optionName={"model"}
                        values={AllImageModels}
                    />

                    <LoadingSpinner isLoading={loading} asButton />

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
                </>
            }
            content={
                <>
                    <WorkflowTextField workflowName={wf_name} optionName={"prompt"} />
                </>
            }
        />
    </div >
})

export async function Action_Previs_Generate_Storyboard(shot: Shot) {
    shot.shotJson?.updateField(wf_loading, true);

    try {
        const workflow = shot.scene.project.workflows[wf_name];

        const prompt = `
            ${shot.shotJson?.data.previs_shots}

            ${workflow.prompt ?? ""}  
            
            ${shot.shotJson?.data.previs_script}
            `;

        const res = await AI.GenerateImage({
            prompt,
            model: workflow.model ?? AllImageModels[0],
        });

        const localImage: LocalImage | null =
            await GoogleAI.saveResultImage(
                res,
                shot.MediaFolder_results as LocalFolder,
            );

        return localImage;

    } finally {
        shot.shotJson?.updateField(wf_loading, false);
    }

    //await ActionGenerateReferences(shot);
}

export const WF_Previs_GenerateStoryboard = {
    wf_name,
    wf_loading,
    component,
}






