import React from "react";
import { observer } from "mobx-react-lite"; // <--- important
import { Scene } from "../classes/Scene";
import EditableJsonTextField from "./EditableJsonTextField";
import TagsContainer from "./TagsContainer";
import SimpleButton from "./SimpleButton";
import LoadingButton from './LoadingButton';

interface Props {
  scene: Scene;
}

const SceneInfoCard: React.FC<Props> = observer(({ scene }) => { // <--- observer
  if (!scene.sceneJson) {
    return <div>No scene data available.</div>;
  }

  const handleSplitIntoShotsAI = async () => {    
    const shots_json = await scene.generateShotsJson();
    await scene.sceneJson?.updateField("shotsjson", shots_json);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(`Are you sure you want to delete scene "${scene.folder.name}"?`);
    if (!confirmed) return;

    await scene.delete();
  };
  const handleCreateShots = async () => {      
      scene.createShotsFromShotsJson();
  };

  return (
    <div>
      <div style={{ marginBottom: "10px" }}>
        <SimpleButton onClick={handleDelete} label="Delete Scene" className="btn-outline-danger" />
        <SimpleButton onClick={() => scene.log()} label="LOG" />
      </div>
      <EditableJsonTextField localJson={scene.sceneJson} field="script" fitHeight headerExtra={
        <LoadingButton onClick={handleSplitIntoShotsAI} className="btn-outline-success" label="Split Into Shots GPT" is_loading={scene.is_generating_shotsjson}/>
      }/>
      {/*<SimpleButton onClick={handleSplitIntoShotsAI} label="Split Into Shots" />*/}
      <EditableJsonTextField localJson={scene.sceneJson} field="shotsjson" fitHeight headerExtra={
        <SimpleButton onClick={handleCreateShots} label="Create Shots" />
      }/>
      <TagsContainer scene={scene} />
    </div>
  );
});

export default SceneInfoCard;
