// MediaGalleryAudio.tsx
import React, { useEffect, useState } from 'react';
import { LocalAudio } from '../../classes/fileSystem/LocalAudio';

interface Props {
  localAudio: LocalAudio;
  height?: number;          // height of audio player
  width?: number;           // width of container
  onClick?: () => void;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

const MediaGalleryAudio: React.FC<Props> = ({
  localAudio,
  height = 250,
  width = 250,
  onClick,
  autoPlay = false,
  loop = false,
  muted = false,
}) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadUrl = async () => {
      try {
        const objectUrl = await localAudio.getUrlObject();
        if (mounted && objectUrl) setUrl(objectUrl);
      } catch (err) {
        console.error('Error loading LocalAudio', err);
      }
    };

    loadUrl();

    return () => {
      mounted = false;
      localAudio.revokeUrl();
    };
  }, [localAudio]);

  return (
    <div
      className="position-relative d-inline-flex flex-column align-items-center justify-content-center"
      style={{
        height: height, // extra space for name label and top padding
        width,
        cursor: 'pointer',
        paddingTop: '20px', // <-- added padding to push content down
        paddingLeft: '5px',
        paddingRight: '5px',
        paddingBottom: '5px',
      }}
      onClick={onClick}
    >
      {/* Audio name */}
      <div
        className="text-center text-truncate w-100"
        style={{ fontSize: '0.8rem', marginBottom: '5px' }}
        title={localAudio.name}
      >
        {localAudio.name}
      </div>

      {/* Audio player */}
      {url ? (
        <audio
          src={url}
          controls
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          style={{ width: '100%', height:'50px' }}
        />
      ) : (
        <div
          className="d-flex align-items-center justify-content-center border rounded w-100"
          style={{ height }}
        >
          Loading...
        </div>
      )}

    </div>
  );
};

export default MediaGalleryAudio;
