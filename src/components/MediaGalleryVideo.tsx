import React, { useEffect, useState } from 'react';
import { LocalVideo } from '../classes/LocalVideo';

interface Props {
  localVideo: LocalVideo;
  height?: number;
  fillParent?: boolean;            // NEW: fill parent container
  topRightExtra?: React.ReactNode;
  onClick?: () => void;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;  
  isSelected?: boolean;
  isPicked?: boolean;
}

const MediaGalleryVideo: React.FC<Props> = ({
  localVideo,
  height = 250,
  fillParent = false,             // default false
  topRightExtra,
  onClick,
  autoPlay = true,
  loop = true,
  muted = true,
  isSelected = false,
  isPicked = false
}) => {
  const [url, setUrl] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadUrl = async () => {
      try {
        const objectUrl = await localVideo.getUrlObject();
        if (mounted && objectUrl) setUrl(objectUrl);
      } catch (err) {
        console.error('Error loading LocalVideo', err);
      }
    };

    loadUrl();

    return () => {
      mounted = false;
      localVideo.revokeUrl(); // cleanup
    };
  }, [localVideo]);

  if (!url) {
    return (
      <div
        className="d-flex align-items-center justify-content-center border rounded p-2"
        style={{ height: `${height}px`, width: 'auto' }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      className="position-relative d-inline-block"
      style={{
        height: fillParent ? '100%' : `${height}px`,
        width: fillParent ? '100%' : 'auto',
        cursor: 'pointer',
        outline: isPicked ? '3px solid #085db7' : 'none',
        outlineOffset: -3,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Green selection circle */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: 5,
            left: 5,
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: 'limegreen',
            border: '2px solid white',
            zIndex: 20,
          }}
        />
      )}

      <video
        src={url}
        onClick={onClick}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        style={{
          height: fillParent ? '100%' : `${height}px`,
          width: fillParent ? '100%' : 'auto',
          objectFit: 'contain',
          display: 'block',
        }}
      />

      {/* Top-right extra container, visible only on hover */}
      {topRightExtra && hovered && (
        <div
          className="position-absolute"
          style={{
            top: '5px',
            right: '5px',
            zIndex: 10,
            display: 'flex',
            gap: '5px',
          }}
        >
          {topRightExtra}
        </div>
      )}
    </div>
  );
};

export default MediaGalleryVideo;
