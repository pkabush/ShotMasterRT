import { observer } from "mobx-react-lite";
import type { Scene } from "../../../classes/Scene";
import { Button } from "react-bootstrap";
import { WF_ShotGenerateMissingReferences } from "../Shot/Actions/ShotGenerateMissingReferences";
import LoadingSpinner from "../../Atomic/LoadingSpinner";
import SettingsButton from "../../Atomic/SettingsButton";
import { WF_ShotGenerateShotlist } from "../Shot/Actions/ShotGenerateShotList";
import { EditableJsonToggleField } from "../../EditableJsonTextField";


interface Props {
    scene: Scene;
}

const wf_name = "wf_scene_generate_all_shot_references";
const wf_loading = `${wf_name}/loading`;
const wf_gen_shotlists = `${wf_name}/generate_shotlists`;
const wf_gen_missingRefs = `${wf_name}/generate_missing_references`;


export const GenerateAllShotReferences: React.FC<Props> = observer(({ scene }) => {

    const loading = scene.sceneJson?.getField(wf_loading) ?? false;
    const shots = scene.shots;

    const n_generating_descriptions = shots.filter(
        (shot) => shot.shotJson?.getField(WF_ShotGenerateMissingReferences.wf_loading)
    ).length;

    const n_generating_images = shots.filter(
        (shot) => shot.shotJson?.getField(WF_ShotGenerateMissingReferences.wf_loading_images)
    ).length;

    const n_generating_shotLists = shots.filter(
        (shot) => shot.shotJson?.getField(WF_ShotGenerateShotlist.wf_loading)
    ).length;

    return <>
        <SettingsButton
            buttons={
                <>
                    <Button
                        size="sm"
                        variant="outline-success"
                        onClick={async () => {

                            await scene.sceneJson?.updateField(wf_loading, true);

                            try {
                                await Promise.all(
                                    scene.shots.map(async (shot) => {
                                        console.log(shot);

                                        const gen_shotlists = scene.project.projinfo!.getField(wf_gen_shotlists) ?? true;
                                        const gen_missing_refs = scene.project.projinfo!.getField(wf_gen_missingRefs) ?? true;

                                        await Promise.all([
                                            gen_shotlists && WF_ShotGenerateShotlist.run(shot),
                                            gen_missing_refs && WF_ShotGenerateMissingReferences.run(shot)
                                        ].filter(Boolean));
                                    })
                                )
                            } finally {
                                await scene.sceneJson?.updateField(wf_loading, false);
                            }

                        }}
                    >Generate All Shot References</Button>

                    <LoadingSpinner isLoading={loading} asButton />

                    <Button size="sm" variant={shots ? "success" : "outline-secondary"}                    >
                        Shots: {Object.keys(shots ?? {}).length}
                    </Button>

                    <Button size="sm" variant={n_generating_descriptions == 0 ? "outline-secondary" : "warning"}>
                        Descriptions: {n_generating_descriptions}
                    </Button>

                    <Button size="sm" variant={n_generating_images == 0 ? "outline-secondary" : "warning"}>
                        Images: {n_generating_images}
                    </Button>

                    <Button size="sm" variant={n_generating_shotLists == 0 ? "outline-secondary" : "warning"}>
                        ShotLists: {n_generating_shotLists}
                    </Button>



                </>
            }
            content={<>
                <EditableJsonToggleField localJson={scene.project.projinfo} field={wf_gen_shotlists} default_val={true} label="Generate Descriptions" />
                <EditableJsonToggleField localJson={scene.project.projinfo} field={wf_gen_missingRefs} default_val={true} label="Generate Missing References" />



            </>}
        />

    </>
        ;
});