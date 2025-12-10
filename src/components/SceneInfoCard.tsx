// SceneInfoCard.tsx
import React from "react";
import { Scene } from "../classes/Scene";
import EditableJsonTextField from "./EditableJsonTextField";
import TagsContainer from "./TagsContainer";

interface Props {
  scene: Scene;
}

const SceneInfoCard: React.FC<Props> = ({ scene }) => {
  if (!scene.sceneJson) {
    return <div>No scene data available.</div>;
  }

  return (
    <div >
      <EditableJsonTextField localJson={scene.sceneJson} field="script" fitHeight />
      <TagsContainer scene={scene} />
    </div>
  );
};

export default SceneInfoCard;
