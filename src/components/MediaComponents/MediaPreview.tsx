import React from "react";
import { observer } from "mobx-react-lite";
import { LocalMedia } from "../../classes/fileSystem/LocalMedia";
import { LocalVideo } from "../../classes/fileSystem/LocalVideo";
import { LocalImage } from "../../classes/fileSystem/LocalImage";
import MediaVideo from "./MediaVideo";
import MediaImage from "./MediaImage";

type MediaPreviewProps = {
  media: LocalMedia | null;
} & React.ImgHTMLAttributes<HTMLImageElement> &
  React.VideoHTMLAttributes<HTMLVideoElement>;

const MediaPreview: React.FC<MediaPreviewProps> = observer(({ media, ...props }) => {  
  if (media instanceof LocalVideo) {
    return <MediaVideo localVideo={media} {...props} />;
  } else if (media instanceof LocalImage) {
    return <MediaImage localImage={media} {...props} />;
  } else {
    return <div {...props}>Unsupported media type</div>;
  }
});

export default MediaPreview;