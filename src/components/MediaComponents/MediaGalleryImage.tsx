import React, { useState } from 'react';
import MediaImage from './MediaImage';
import { LocalImage } from '../../classes/LocalImage';

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
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="position-relative d-inline-block"
      style={{
        height,
        cursor: 'pointer',
        outline: isPicked ? '3px solid #085db7' : 'none',
        outlineOffset: -3,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
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

      <MediaImage
        localImage={localImage}
        className="img-fluid"
        style={{
          height,
          width: 'auto',
          objectFit: 'contain',
          display: 'block',
        }}
        onClick={onClick}
        alt="Media"
      />

      {topRightExtra && hovered && (
        <div
          style={{
            position: 'absolute',
            top: 5,
            right: 5,
            zIndex: 10,
            display: 'flex',
            gap: 5,
          }}
        >
          {topRightExtra}
        </div>
      )}

      {hovered && zoomOnHover && (
        <MediaImage
          localImage={localImage}
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