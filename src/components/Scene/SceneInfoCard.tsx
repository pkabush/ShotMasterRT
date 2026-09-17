import React from "react";
import { observer } from "mobx-react-lite"; // <--- important
import { Scene } from "../../classes/Scene";
import EditableJsonTextField from "../EditableJsonTextField";
import { TagsFolderContainer } from "../FolderTags/FolderTagsContainer";
import type { LocalFolder } from "../../classes/fileSystem/LocalFolder";
import { FindSceneReferencesButton } from "./Actions/FindSceneReferences";
import { SplitSceneIntoShotsButton } from "./Actions/SplitSceneIntoShots";
import { GenerateAllShotReferences } from "./Actions/GenerateAllShotReferences";
import { SceneGenerateItemReferencesComponent } from "./Actions/GenerateSceneItemReferences";
import { MediaFolderGallery } from "../MediaFolderGallery";

interface Props {
  scene: Scene;
}

const SceneInfoCard: React.FC<Props> = observer(({ scene }) => { // <--- observer
  if (!scene.sceneJson) {
    return <div>No scene data available.</div>;
  }

  return (
    <div>
      {/** GENERATE SHOTS JSON */}
      <SplitSceneIntoShotsButton scene={scene} />

      <FindSceneReferencesButton scene={scene} />

      <GenerateAllShotReferences scene={scene} />

      <SceneGenerateItemReferencesComponent scene={scene} />

      <EditableJsonTextField localJson={scene.sceneJson} field="script" fitHeight collapsed={true} />

      <TagsFolderContainer tags={scene.references} folders={[scene.project, scene.project.artbook as LocalFolder, scene]} />

      <MediaFolderGallery mediaFolder={scene} defaultCollapsed={true}/>
      <div style={{ height: "500px" }}></div>
    </div>
  );
});

export default SceneInfoCard;

