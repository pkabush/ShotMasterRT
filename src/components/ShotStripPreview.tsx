// ShotStripPreview.tsx
import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Shot } from '../classes/Shot';
import MultiStateToggle from './Atomic/MultiStateToggle';
import MediaImage from './MediaComponents/MediaImage';
import BottomCenterLabel from './Atomic/MediaElements/BottomCenterLabel';

interface Props {
  shot: Shot;
  isSelected: boolean;
  onClick: (shot: Shot) => void;
}



const ShotStripPreview: React.FC<Props> = observer(({ shot, isSelected, onClick }) => {

  return (
    <div
      className="flex-shrink-0 position-relative d-flex align-items-center justify-content-center"
      style={{
        height: '100%',
        cursor: 'pointer',
        borderWidth: isSelected ? 2 : 0,
        borderColor: isSelected ? '#04914a' : '#dee2e6',
        borderStyle: 'solid',
      }}
      onClick={() => onClick(shot)}
    >
      {shot.srcImage ? (
        <MediaImage
          localImage={shot.srcImage}
          alt={shot.name}
          className="img-fluid"
          style={{
            height: '100%',
            width: 'auto',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      ) : (
        <div
          style={{
            height: '100%',
            aspectRatio: '9 / 16',
            backgroundColor: 'black',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'grey',
            fontSize: '1rem',
            fontWeight: 500,
          }}
        >
          {shot.name}
        </div>
      )}


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
        {shot.name}
      </div>


      {/* Finished toggle overlay */}
      <div
        className="position-absolute"
        style={{
          top: 2,
          right: 2,
        }}
        onClick={(e) => e.stopPropagation()} // prevent parent onClick
      >

        <MultiStateToggle
          states={Shot.shot_states}
          value={shot.shotJson!.data?.shot_state || Object.keys(Shot.shot_states)[0]}
          onChange={(newState) => { if (shot.shotJson) { shot.shotJson.updateField("shot_state", newState); } }}
          useIndicator={true}
        />

      </div>

    </div>
  );
});

export default ShotStripPreview;
