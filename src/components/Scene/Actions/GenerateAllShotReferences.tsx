import { observer } from "mobx-react-lite";
import type { Scene } from "../../../classes/Scene";
import { Button } from "react-bootstrap";
import { ActionShotGenerateMissingReferencesDescription, WF_ShotGenerateMissingReferences } from "../Shot/Actions/ShotGenerateMissingReferences";
import LoadingSpinner from "../../Atomic/LoadingSpinner";
import SettingsButton from "../../Atomic/SettingsButton";


interface Props {
    scene: Scene;
}

const wf_name = "wf_scene_generate_all_shot_references";
const wf_loading = `${wf_name}/loading`;

export const GenerateAllShotReferences: React.FC<Props> = observer(({ scene }) => {

    const loading = scene.sceneJson?.getField(wf_loading) ?? false;
    const shots = scene.shots;

    const n_generating_descriptions = shots.filter(
        (shot) => shot.shotJson?.getField(WF_ShotGenerateMissingReferences.wf_loading)
    ).length;

    const n_generating_images = shots.filter(
        (shot) => shot.shotJson?.getField(WF_ShotGenerateMissingReferences.wf_loading_images)
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
                                        await ActionShotGenerateMissingReferencesDescription(shot);
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



                </>
            }
            content={<></>}
        />

    </>
        ;
});