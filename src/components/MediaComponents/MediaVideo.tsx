import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { LocalVideo } from "../../classes/fileSystem/LocalVideo";

interface Props extends React.VideoHTMLAttributes<HTMLVideoElement> {
  localVideo: LocalVideo;
}

const MediaVideo: React.FC<Props> = observer(({ localVideo, ...props }) => {

  useEffect(() => {
    if (!localVideo.urlObject) {
      localVideo.getUrlObject();
    }
  }, [localVideo]);

  if (!localVideo.urlObject) {
    return <div>Loading...</div>;
  }

  return (
    <video
      src={localVideo.urlObject}
      {...props}
    />
  );
});

export default MediaVideo;