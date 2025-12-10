// ShotStripPreview.tsx
import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Shot } from '../classes/Shot';
import { LocalImage } from '../classes/LocalImage';

interface Props {
  shot: Shot;
  isSelected: boolean;
  onClick: (shot: Shot) => void;
}

const DEFAULT_IMAGE_URL =
  'https://cdn.pixabay.com/photo/2021/05/09/06/07/dog-6240043_1280.jpg';

const ShotStripPreview: React.FC<Props> = observer(({ shot, isSelected, onClick }) => {
  const [imageUrl, setImageUrl] = useState<string>(DEFAULT_IMAGE_URL);

  useEffect(() => {
    let canceled = false;

    const loadImage = async () => {
      if (shot.srcImage) {
        try {
          const url = await shot.srcImage.getUrlObject();
          if (!canceled && url) setImageUrl(url);
        } catch (err) {
          console.error('Failed to load srcImage URL:', err);
          if (!canceled) setImageUrl(DEFAULT_IMAGE_URL);
        }
      } else {
        setImageUrl(DEFAULT_IMAGE_URL);
      }
    };

    loadImage();

    return () => {
      canceled = true;
    };
  }, [shot.srcImage]);

  return (
    <div
      className="flex-shrink-0 border rounded position-relative d-flex align-items-center justify-content-center"
      style={{
        height: '100%',
        cursor: 'pointer',
        borderWidth: isSelected ? 2 : 1,
        borderColor: isSelected ? '#0d6efd' : '#dee2e6',
      }}
      onClick={() => onClick(shot)}
    >
      <img
        src={imageUrl}
        alt={shot.folder.name}
        className="img-fluid"
        style={{
          height: '100%',
          width: 'auto',
          objectFit: 'contain',
          display: 'block',
        }}
      />

      {/* Shot name overlay */}
      <div
        className="position-absolute text-white px-1"
        style={{
          bottom: 0,
          left: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          fontSize: '0.75rem',
          borderTopRightRadius: '4px',
        }}
      >
        {shot.folder.name}
      </div>
    </div>
  );
});

export default ShotStripPreview;
