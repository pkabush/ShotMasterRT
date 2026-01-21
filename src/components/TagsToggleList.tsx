import React from "react";
import { observer } from "mobx-react-lite";
import CollapsibleContainer from "./Atomic/CollapsibleContainer";
import { Shot } from "../classes/Shot";

interface TagsToggleListProps {
  shot: Shot;
}

const TagsToggleList: React.FC<TagsToggleListProps> = observer(({ shot }) => {
  const scene = shot.scene;
  if (!scene.sceneJson || !scene.sceneJson.data) return null;

  const tags = scene.sceneJson.data.tags;
  const artbook = scene.project?.artbook;

  if (!artbook) return null;

  return (
    <CollapsibleContainer label="Tags">
      {tags.length ? (
        <ul className="list-group list-group-flush">
          {tags.map((tagPath: string, index: number) => {
            const art = artbook.getTag(tagPath);
            if (!art) return null;

            const isActive = !shot.getSkippedTags().includes(art.path);

            return (
              <li
                key={index}
                className="list-group-item p-0 border-0 d-flex align-items-center gap-2"
              >
                <input
                  type="checkbox"
                  className="form-check-input m-0"
                  checked={isActive}
                  onChange={(e) => {
                    shot.setTagSkipped(art.path, !e.target.checked);
                  }}
                />
                <span className={!isActive ? "text-muted" : ""}>{art.path}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div>No tags.</div>
      )}
    </CollapsibleContainer>
  );
});

export default TagsToggleList;
