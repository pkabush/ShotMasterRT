import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { LocalVideo } from "../../classes/fileSystem/LocalVideo";

interface Props extends React.VideoHTMLAttributes<HTMLVideoElement> {
  localVideo: LocalVideo;
}

const MediaVideo: React.FC<Props> = observer(({ localVideo, ...props }) => {
  const [loaded, setLoaded] = useState(!!localVideo.urlObject);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!localVideo.urlObject) {
        await localVideo.getUrlObject();
        if (isMounted) setLoaded(true); // force re-render when URL is ready
      } else {
        setLoaded(true);
      }
    };

    load();

    return () => { isMounted = false; };
  }, [localVideo]);

  if (!loaded) {
    return <div>Loading...</div>;
  }

  return (<video src={localVideo.urlObject!} {...props} />);
});

export default MediaVideo;