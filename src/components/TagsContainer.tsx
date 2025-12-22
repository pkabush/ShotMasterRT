import React from "react";
import { observer } from "mobx-react-lite";
import CollapsibleContainer from "./CollapsibleContainer";
import { Scene } from "../classes/Scene";
import SimpleButton from "./SimpleButton";
import TagListItem from "./TagListItem";
import ArtDropdownItem from "./ArtDropdownItem";
//import { runInAction } from "mobx";
import LoadingButton from './LoadingButton';
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import "../css/Dropdown.css";


interface TagsContainerProps {
  scene: Scene;
}

const TagsContainer: React.FC<TagsContainerProps> = observer(({ scene }) => {
  if (!scene.sceneJson || !scene.sceneJson.data) return null;

  const tags = scene.sceneJson.data.tags;
  const artbook = scene.project?.artbook;

  const addTag = (path: string) => { scene.addTag(path); };

  if (!artbook) return null;

  // Recursive function to build nested dropdown menus
  const buildDropdownFromArtbook = (
    data: Record<string, Record<string, any[]>>
  ): React.ReactNode => {

  return (
      <DropdownMenu.Root >
        <DropdownMenu.Trigger className="dropdown-trigger">
          Add Tag
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content className="dropdown-content" align="start">
            {Object.entries(data).map(([typeName, items]) => (
              <DropdownMenu.Sub key={typeName}>
                <DropdownMenu.SubTrigger className="submenu-trigger">
                  {typeName}
                </DropdownMenu.SubTrigger>

                <DropdownMenu.SubContent className="dropdown-content" >
                  {Object.entries(items).map(([itemName, arts]) => (
                    <DropdownMenu.Sub key={itemName}>
                      <DropdownMenu.SubTrigger className="submenu-trigger">
                        {itemName}
                      </DropdownMenu.SubTrigger>

                      <DropdownMenu.SubContent className="dropdown-content" >
                        {arts.map((art) => (
                          <ArtDropdownItem
                            key={art.path}
                            art={art}
                            onClick={() => addTag(art.path)}
                          />
                        ))}
                      </DropdownMenu.SubContent>
                    </DropdownMenu.Sub>
                  ))}
                </DropdownMenu.SubContent>
              </DropdownMenu.Sub>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
  };

  return (
    <CollapsibleContainer
      label="Tags"
      headerExtra={
        <div className="d-flex align-items-center gap-2">
          
          {/*}
          <SimpleDropDownMenu label="+ Add Tag" direction="down">
            {buildDropdownFromArtbook(artbook.data)}
          </SimpleDropDownMenu>
          */}

          {buildDropdownFromArtbook(artbook.data)}


          <LoadingButton onClick={()=>{scene.generateTags()}} className="btn-outline-success" label="Generate Tags" is_loading={scene.is_generating_tags}/>
          <SimpleButton
            onClick={() => scene.project?.artbook?.log()}
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
