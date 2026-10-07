import React, { useEffect, useRef, useState } from 'react';
import { LocalAudio } from '../../classes/fileSystem/LocalAudio';

interface Props {
  localAudio: LocalAudio;
  height?: number;
  width?: number | string;
  onClick?: () => void;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playbackRate?: number;
}

const InlineAudio: React.FC<Props> = ({
  localAudio,
  height = 40,
  width = '100%',
  onClick,
  autoPlay = false,
  loop = false,
  muted = false,
  playbackRate = 1,
}) => {
  const [url, setUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let mounted = true;

    const loadUrl = async () => {
      try {
        const objectUrl = await localAudio.getUrlObject();

        if (mounted && objectUrl) {
          setUrl(objectUrl);
        }
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

  // Apply playback rate whenever the audio element OR rate changes.
  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const rate = Number(playbackRate);

    if (Number.isFinite(rate) && rate > 0) {
      audio.playbackRate = rate;
    }
  }, [playbackRate, url]);

  return (
    <div
      className="d-flex align-items-center w-100"
      style={{
        height,
        width,
        cursor: onClick ? 'pointer' : 'default',
        gap: '10px',
      }}
      onClick={onClick}
    >
      <div
        className="text-truncate"
        style={{
          flex: '0 0 180px',
          minWidth: 0,
          fontSize: '0.8rem',
        }}
        title={localAudio.name}
      >
        {localAudio.name}
      </div>

      {url ? (
        <audio
          ref={audioRef}
          src={url}
          controls
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          style={{
            flex: '1 1 auto',
            minWidth: 0,
            width: '100%',
            height: '40px',
          }}
        />
      ) : (
        <div
          className="d-flex align-items-center"
          style={{
            flex: '1 1 auto',
            height: '40px',
            fontSize: '0.8rem',
          }}
        >
          Loading...
        </div>
      )}
    </div>
  );
};

export default InlineAudio;