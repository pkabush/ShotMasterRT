import React, { useState } from 'react';
import MediaImage from './MediaImage';
import { LocalImage } from '../../classes/fileSystem/LocalImage';

interface Props {
  localImage: LocalImage;
  height?: number;
  onClick?: () => void;
  zoomOnHover?: boolean;
}

const MediaGalleryImage: React.FC<Props> = ({
  localImage,
  height = 150,
  onClick,
  zoomOnHover = false,
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="position-relative d-inline-block"
      style={{
        height,
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >

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