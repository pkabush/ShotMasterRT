// ShotStripPreview.tsx
import React from 'react';
import { observer } from 'mobx-react-lite';
import { Shot } from '../classes/Shot';
import MultiStateToggle from './Atomic/MultiStateToggle';
import type { LocalImage } from '../classes/fileSystem/LocalImage';
import MediaPreview from './MediaComponents/MediaPreview';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFaceSurprise, faFilm, faImage } from '@fortawesome/free-solid-svg-icons';

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
      {shot.previewMedia ? (
        <MediaPreview
          media={shot.previewMedia as LocalImage}
          className="img-fluid"
          style={{
            height: '100%',
            width: 'auto',
            objectFit: 'contain',
            display: 'block',
          }}
          autoPlay={true}
          loop={true}
          muted={true}
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


      {/* Top-left icons container */}
      <div
        className="position-absolute d-flex"
        style={{
          top: 1,
          left: 1,
          gap: '0px', // space between icons
          backgroundColor: 'rgba(0,0,0,0.4)', // subtle dark background
          borderRadius: '4px',               // rounded corners
          padding: '2px 1px',                // space around icons
          alignItems: 'center',              // vertically center icons
        }}
      >
        {/* Image icon */}
        <FontAwesomeIcon
          icon={faImage}
          style={{
            color: shot.srcImage ? '#e2eb3a' : 'white',
            opacity: shot.srcImage ? 1 : 0.2,
            fontSize: '1.2rem', // bigger icons
          }}
          title={shot.srcImage ? "Image available" : "No image"}
        />

        {/* Video icon */}
        <FontAwesomeIcon
          icon={faFilm}
          style={{
            color: shot.outVideo ? '#2fde35' : 'white',
            opacity: shot.outVideo ? 1 : 0.2,
            fontSize: '1.2rem', // match icon size
          }}
          title={shot.outVideo ? "Video available" : "No video"}
        />

        {/* Lipsync icon */}
        <FontAwesomeIcon
          icon={faFaceSurprise}
          style={{
            color: shot.outVideoLipsync ? '#ff61e2' : 'white', // red-ish if lipsync exists
            opacity: shot.outVideoLipsync ? 1 : 0.2,
            fontSize: '1.2rem',
          }}
          title={shot.outVideoLipsync ? "Lipsync available" : "No lipsync"}
        />
      </div>




      {/* Finished toggle overlay */}
      <div
        className="position-absolute"
        style={{
          top: 4,
          right: 4,
        }}
        onClick={(e) => e.stopPropagation()} // prevent parent onClick
      >

        <MultiStateToggle
          states={Shot.shot_states}
          value={shot.shotJson?.data?.shot_state || Object.keys(Shot.shot_states)[0]}
          onChange={(newState) => { if (shot.shotJson) { shot.shotJson.updateField("shot_state", newState); } }}
          useIndicator={true}
        />

      </div>

    </div>
  );
});

export default ShotStripPreview;
