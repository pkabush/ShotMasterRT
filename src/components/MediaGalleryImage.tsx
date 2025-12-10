import React, { useEffect, useState } from 'react';
import { LocalImage } from '../classes/LocalImage';

interface Props {
  localImage: LocalImage;
  height?: number;
  topRightExtra?: React.ReactNode; // extra content in top-right corner
}

const MediaGalleryImage: React.FC<Props> = ({ localImage, height = 150, topRightExtra }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadUrl = async () => {
      try {
        const objectUrl = await localImage.getUrlObject();
        if (mounted && objectUrl) setUrl(objectUrl);
      } catch (err) {
        console.error('Error loading LocalImage', err);
      }
    };

    loadUrl();

    return () => {
      mounted = false;
    };
  }, [localImage]);

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
      <img
        src={url}
        alt="Media"
        className="img-fluid"
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

export default MediaGalleryImage;
