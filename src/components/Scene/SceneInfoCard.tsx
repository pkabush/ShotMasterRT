import React from "react";
import { observer } from "mobx-react-lite"; // <--- important
import { Scene } from "../../classes/Scene";
import EditableJsonTextField from "../EditableJsonTextField";
import { TagsFolderContainer } from "../FolderTags/FolderTagsContainer";
import type { LocalFolder } from "../../classes/fileSystem/LocalFolder";
import { FindSceneReferencesButton } from "./Actions/FindSceneReferences";
import { SplitSceneIntoShotsButton } from "./Actions/SplitSceneIntoShots";

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

      <EditableJsonTextField localJson={scene.sceneJson} field="script" fitHeight collapsed={true} />

      <TagsFolderContainer tags={scene.references} folders={[scene.project, scene.project.artbook as LocalFolder, scene]} />

      <div style={{ height: "500px" }}></div>
    </div>
  );
});

export default SceneInfoCard;

