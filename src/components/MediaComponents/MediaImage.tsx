import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { LocalImage } from "../../classes/LocalImage";

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  localImage: LocalImage;
}

const MediaImage: React.FC<Props> = observer(({ localImage, ...props }) => {

  useEffect(() => {
    if (!localImage.urlObject) {
      localImage.getUrlObject();
    }
  }, [localImage]);

  if (!localImage.urlObject) {
    return <div>Loading...</div>;
  }

  return (
    <img
      src={localImage.urlObject}
      {...props}
    />
  );
});

export default MediaImage;