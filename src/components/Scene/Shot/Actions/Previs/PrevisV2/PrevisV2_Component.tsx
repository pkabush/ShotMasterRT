import { observer } from "mobx-react-lite";
import type { Shot } from "../../../../../../classes/Shot";
import EditableJsonTextField from "../../../../../EditableJsonTextField";
import { WF_Previs_GenerateScript } from "../PrevisGenerateScript";
import { WF_Previs_GenerateShotsJSON } from "./PrevisGenerateShotlistJson";
import { WF_Previs_GenerateStoryboard } from "../PrevisGenerateStoryboard";
import { MediaFolderGallery } from "../../../../../MediaFolderGallery";
import { Previs_ShotJsonPreview } from "./PrevisShotsJsonPreview";
import { Previs_SceneSpeakersMap } from "./Previs_SceneSpeakersMap";
import { TagsFolderContainer } from "../../../../../FolderTags/FolderTagsContainer";
import { Project } from "../../../../../../classes/Project";
import type { LocalFolder } from "../../../../../../classes/fileSystem/LocalFolder";

interface Props {
    shot: Shot;
}

const PrevisV2: React.FC<Props> = observer(({ shot }) => {
    if (!shot.shotJson) {
        return <div>Loading shot info...</div>;
    }

    const show_logline = shot.scene.project.projinfo?.getField("workflows/previs_settings/show_logline") ?? false;

    return (
        <>
            <h4>References</h4>
            <TagsFolderContainer tags={shot.references} folders={[Project.getProject(), Project.getProject().artbook as LocalFolder, shot as LocalFolder]} />


            {show_logline && <>
                <h4>Logline</h4>
                <EditableJsonTextField localJson={shot.shotJson} field="previs_logline" fitHeight collapsed />
                <WF_Previs_GenerateScript.component shot={shot} />
            </>}

            <h4>Script</h4>
            <EditableJsonTextField localJson={shot.shotJson} field="previs_script" fitHeight collapsed />
            <WF_Previs_GenerateShotsJSON.component shot={shot} />


            <h4>Storyboard</h4>
            <WF_Previs_GenerateStoryboard.component shot={shot} use_shots_json={true} />
            <MediaFolderGallery mediaFolder={shot.MediaFolder_results} defaultCollapsed={true} />


            <Previs_ShotJsonPreview shot={shot} />
            <Previs_SceneSpeakersMap scene={shot.scene} />

            <br />
            <br />
            <br />

            <h4>Combined Video</h4>
            <MediaFolderGallery mediaFolder={shot.MediaFolder_genVideo} defaultCollapsed={true} />

            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
        </>
    );
});

export default PrevisV2;
