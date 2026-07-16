import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { LocalVideo } from "../../classes/fileSystem/LocalVideo";

interface Props extends React.VideoHTMLAttributes<HTMLVideoElement> {
  localVideo: LocalVideo;
  playOnHover?: boolean;
}

const MediaVideo: React.FC<Props> = observer(({ localVideo, playOnHover = true, draggable = true,...props }) => {
  const [loaded, setLoaded] = useState(!!localVideo.urlObject);
  const videoRef = useRef<HTMLVideoElement>(null);

  // WAIT FOR LOADED
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

  // AUTOPLAY
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !loaded) return;

    if (props.autoPlay) {
      video.play().catch(() => {
        // Ignore autoplay failures (browser policy)
      });
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [props.autoPlay, loaded]);

  // PLAY ON HOVER 
  const handleMouseEnter = () => {
    const video = videoRef.current;
    if (!video || props.autoPlay || !playOnHover) return;
    video.play().catch(() => { });
  };

  const handleMouseLeave = () => {
    const video = videoRef.current;
    if (!video || props.autoPlay || !playOnHover) return;
    video.pause();
    video.currentTime = 0;
  };

  if (!loaded) {
    return <div>Loading...</div>;
  }

  return (<video src={localVideo.urlObject!} {...props}
    ref={videoRef}
    draggable={draggable}
    onDragStart={(e) => {
      e.dataTransfer.setData("LocalFilePath", localVideo.path);
    }}
    onMouseEnter={(e) => {
      props.onMouseEnter?.(e);
      handleMouseEnter();
    }}
    onMouseLeave={(e) => {
      props.onMouseLeave?.(e);
      handleMouseLeave();
    }}
  />);
});

export default MediaVideo;