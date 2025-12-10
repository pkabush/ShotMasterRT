// TagsContainer.tsx
import React from "react";
import { observer } from "mobx-react-lite";
import CollapsibleContainer from "./CollapsibleContainer";
import { Scene } from "../classes/Scene";
import SimpleButton from "./SimpleButton";
import TagListItem from "./TagListItem";

interface TagsContainerProps {
  scene: Scene;
}

const TagsContainer: React.FC<TagsContainerProps> = observer(({ scene }) => {
  if (!scene.sceneJson || !scene.sceneJson.data) return null;

  const addTag = () => {
    const newTag = prompt("Enter new tag (path to art, e.g. ПЕРСОНАЖИ/ЙОЗЕФ/Portrait.png):");
    if (newTag) {
      scene.sceneJson.data.tags.push(newTag); // directly mutate observable array
    }
  };
  

  const tags = scene.sceneJson.data.tags;

  return (
    <CollapsibleContainer
      label="Tags"
      headerExtra={
        <>
          <SimpleButton onClick={addTag} label="+ Add Tag" />
          <SimpleButton onClick={() => console.log(scene.project?.artbook)} label="Log" />
        </>
      }
    >
      {tags.length ? (
        <ul className="list-group list-group-flush">
          {tags.map((tagPath, index) => {
            const art = scene.project?.artbook?.getTag(tagPath);
            if (!art) return null; // skip invalid paths
            return (
              <li key={index} className="list-group-item">
                <TagListItem art={art} scene={scene}/>
              </li>
            );
          })}
        </ul>
      ) : (
        <div>No tags yet.</div>
      )}
    </CollapsibleContainer>
  );
});

export default TagsContainer;
