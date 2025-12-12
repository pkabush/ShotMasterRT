import React from "react";
import { observer } from "mobx-react-lite";
import CollapsibleContainer from "./CollapsibleContainer";
import { Scene } from "../classes/Scene";
import SimpleButton from "./SimpleButton";
import TagListItem from "./TagListItem";
import SimpleDropDownMenu from "./SimpleDropDownMenu";
import ArtDropdownItem from "./ArtDropdownItem";
import { runInAction } from "mobx";

interface TagsContainerProps {
  scene: Scene;
}

const TagsContainer: React.FC<TagsContainerProps> = observer(({ scene }) => {
  if (!scene.sceneJson || !scene.sceneJson.data) return null;

  const tags = scene.sceneJson.data.tags;
  const artbook = scene.project?.artbook;

  const addTag = (path: string) => {
    runInAction(() => {
      tags.push(path);
      scene.sceneJson!.save();
    });
  };

  if (!artbook) return null;

  // Recursive function to build nested dropdown menus
  const buildDropdownFromArtbook = (
    data: Record<string, Record<string, any[]>>
  ): React.ReactNode => {
    return Object.entries(data).map(([typeName, items]) => (
      <SimpleDropDownMenu label={typeName} key={typeName} direction={"left"}>
        {Object.entries(items).map(([itemName, arts]) => (
          <SimpleDropDownMenu label={itemName} key={itemName} direction="left">
            {arts.map((art) => (
              <ArtDropdownItem
                key={art.path}
                art={art}
                onClick={() => addTag(art.path)}
              />
            ))}
          </SimpleDropDownMenu>
        ))}
      </SimpleDropDownMenu>
    ));
  };

  return (
    <CollapsibleContainer
      label="Tags"
      headerExtra={
        <div className="d-flex align-items-center gap-2">
          <SimpleDropDownMenu label="+ Add Tag" direction="down">
            {buildDropdownFromArtbook(artbook.data)}
          </SimpleDropDownMenu>
          <SimpleButton
            onClick={() => console.log(scene.project?.artbook)}
            label="Log"
          />


        </div>
      }
    >
      {tags.length ? (
        <ul className="list-group list-group-flush">
          {tags.map((tagPath:string, index:number) => {
            const art = artbook.getTag(tagPath);
            if (!art) return null;
            return (
              <li key={index} className="list-group-item">
                <TagListItem art={art} scene={scene} />
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
