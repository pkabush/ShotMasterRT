import React, { useEffect, useState } from 'react';
import { LocalVideo } from '../classes/LocalVideo';

interface Props {
  localVideo: LocalVideo;
  height?: number;
  topRightExtra?: React.ReactNode;
  onClick?: () => void;
  autoPlay?: boolean; // optional autoplay
  loop?: boolean;     // optional loop
  muted?: boolean; // optional prop  
}

const MediaGalleryVideo: React.FC<Props> = ({
  localVideo,
  height = 250,
  topRightExtra,
  onClick,
  autoPlay = true,
  loop = true,
  muted = true
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
      localVideo.revokeUrl(); // optional cleanup
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
      className="position-relative d-inline-block border rounded"
      style={{ height: `${height}px`, cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <video
        src={url}
        height={height}
        onClick={onClick}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        style={{
          height: `${height}px`,
          width: 'auto',
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
