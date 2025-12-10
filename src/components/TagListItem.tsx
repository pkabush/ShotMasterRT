import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Art } from "../classes/Art";
import { Scene } from "../classes/Scene";
import SimpleButton from "./SimpleButton";

type Props = {
  art: Art;
  scene: Scene;
};

const TagListItem: React.FC<Props> = observer(({ art, scene }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    art.getArtInfo(); // load metadata
    let mounted = true;

    const loadUrl = async () => {
      const objectUrl = await art.image.getUrlObject();
      if (mounted) setUrl(objectUrl || null);
    };
    loadUrl();

    return () => {
      mounted = false;
      art.image.revokeUrl();
    };
  }, [art]);

  if (!url) return null; // do not render until URL is ready

  const removeTag = () => {
    //console.log(scene.sceneJson?.data)

    scene.removeTag(art.path);
    /*
    if (!scene.sceneJson?.data?.tags) return;
    // remove this art's path from the scene tags
    scene.sceneJson.data.tags = scene.sceneJson.data.tags.filter(
      (tag: string) => tag !== art.path
    );
    */
  };

  return (
    <div className="d-flex align-items-center justify-content-between">
      <div className="d-flex align-items-center">
        <img
          src={url}
          alt={art.handle.name}
          style={{ width: 40, height: 40, objectFit: "cover", marginRight: 8 }}
        />
        <div>
          <div>{art.handle.name}</div>
          <small className="text-muted">{art.path}</small>
          {art.artInfo && (
            <div>
              <small>{art.artInfo.data?.description || ""}</small>
            </div>
          )}
        </div>
      </div>

      <SimpleButton onClick={removeTag} label="X" />

    </div>
  );
});

export default TagListItem;
