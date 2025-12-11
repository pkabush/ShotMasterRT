// SceneInfoCard.tsx
import React from "react";
import { Scene } from "../classes/Scene";
import EditableJsonTextField from "./EditableJsonTextField";
import TagsContainer from "./TagsContainer";
import SimpleButton from "./SimpleButton"; // import your simple button

interface Props {
  scene: Scene;
}

const SceneInfoCard: React.FC<Props> = ({ scene }) => {
  if (!scene.sceneJson) {
    return <div>No scene data available.</div>;
  }


  const handleDelete = async () => {
    const confirmed = window.confirm(`Are you sure you want to delete scene "${scene.folder.name}"?`);
    if (!confirmed) return;

    await scene.delete();
  };

  return (
    <div >
      <div style={{ marginBottom: "10px" }}>
        <SimpleButton onClick={handleDelete} label="Delete Scene" className="btn-outline-danger" />
      </div>
      <EditableJsonTextField localJson={scene.sceneJson} field="script" fitHeight />
      <TagsContainer scene={scene} />
    </div>
  );
};

export default SceneInfoCard;
