import { observer } from "mobx-react-lite";
import type { Shot } from "../../../../classes/Shot";
import SettingsButton from "../../../Atomic/SettingsButton";
import { WorkflowTextField } from "../../../WorkflowOptionSelect";
import LoadingSpinner from "../../../Atomic/LoadingSpinner";
import EditableJsonTextField from "../../../EditableJsonTextField";
import { WF_ShotGenerateShotlist } from "./ShotGenerateShotList";
import SimpleSelect from "../../../Atomic/SimpleSelect";
import { AI } from "../../../../classes/AiProviders/AI_Generic";
import { WorkflowTextModelSelect } from "../../../../classes/AiProviders/AI_Generic_Components";

const wf_name = "shot_generate_video_prompt"
const wf_output = `${wf_name}/output`
const wf_loading = `${wf_name}/loading`
const wf_chartype = `${wf_name}/chartype`

const wf_chartype_prompts = {
    simple: wf_name,
    multi: `${wf_name}_multichar`,
} as const;

type Chartype = keyof typeof wf_chartype_prompts;
const wf_chartypes = Object.keys(wf_chartype_prompts) as Chartype[];

interface Props {
    shot: Shot;
}


export const ShotGenerateVideoPrompt: React.FC<Props> = observer(({ shot }) => {
    //const project = shot.scene.project;

    const loading = shot.shotJson?.getField(wf_loading) ?? false;
    const chartype = (shot.scene.sceneJson?.getField(wf_chartype) ?? "simple") as Chartype;

    return <div>
        <SettingsButton
            className="mb-2"
            buttons={
                <>
                    <button className="btn btn-sm btn-outline-success"
                        onClick={async () => { ActionGenerateVideoPrompt(shot); }} >
                        Generate Video Prompt
                    </button>

                    {/* Model Selector */}
                    <WorkflowTextModelSelect workflowName={wf_name} />

                    <SimpleSelect
                        value={chartype}
                        options={wf_chartypes}
                        label={"CharCount"}
                        onChange={(val: string) => {
                            shot.scene.sceneJson?.updateField(wf_chartype, val)
                        }}
                    />


                    <LoadingSpinner isLoading={loading} asButton />




                </>
            }
            content={
                <>
                    <WorkflowTextField workflowName={wf_chartype_prompts[chartype]} optionName={"prompt"} />


                    <EditableJsonTextField localJson={shot.shotJson} field={wf_output} />

                </>
            }
        />
    </div>;
});


export async function ActionGenerateVideoPrompt(shot: Shot) {
    const project = shot.scene.project;
    const chartype = (shot.scene.sceneJson?.getField(wf_chartype) ?? "simple") as Chartype;

    shot.shotJson?.updateField(wf_loading, true);

    try {

        const workflow = shot.scene.project.workflows[wf_chartype_prompts[chartype]];

        const prompt = `
        ${workflow.prompt ?? ""}

        Generation Description:
        ${shot.shotJson?.data.description}

        Shotlist:
        ${shot.shotJson?.getField(WF_ShotGenerateShotlist.wf_output)}

        References Ordered:
`;

        //const images = await shot.references?.GetAI_Images();
        const images = shot.references?.active_images;

        const model = project.workflows[wf_name].model;

        const res = await AI.GenerateText({
            prompt,
            model,
            images
        });

        await shot.shotJson!.updateField(wf_output, res);
        await shot.shotJson!.updateField("video_prompt", res);


    } finally {
        shot.shotJson?.updateField(wf_loading, false);
    }
}