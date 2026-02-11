import React, { useEffect, useState } from 'react';
import { LocalImage } from '../classes/LocalImage';

interface Props {
  localImage: LocalImage;
  height?: number;
  topRightExtra?: React.ReactNode;
  onClick?: () => void;
  isSelected?: boolean;
  isPicked?: boolean;
  zoomOnHover?: boolean;
}

const MediaGalleryImage: React.FC<Props> = ({
  localImage,
  height = 150,
  topRightExtra,
  onClick,
  isSelected = false,
  isPicked = false,
  zoomOnHover = false,
}) => {
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
      className="position-relative d-inline-block"
      style={{
        height: `${height}px`, cursor: 'pointer',
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


      <img
        src={url}
        alt="Media"
        className="img-fluid"
        onClick={onClick}
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

      {hovered && zoomOnHover && (
        <img
          src={url}
          style={{
            position: 'absolute',
            top: '100%',
            left: '100%',
            width: 400,
            zIndex: 50000,
            borderRadius: 6,
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          }}
        />
      )}

    </div>
  );
};

export default MediaGalleryImage;
