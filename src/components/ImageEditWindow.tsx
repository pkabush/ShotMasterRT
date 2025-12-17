import React, { useEffect, useState } from 'react';
import { LocalImage } from '../classes/LocalImage';
import GenericTextEditor from './GenericTextEditor';

interface ImageEditWindowProps {
  localImage: LocalImage;
  initialText?: string;
  onTextSave?: (text: string) => void;
  onClose?: () => void;
}

const ImageEditWindow: React.FC<ImageEditWindowProps> = ({
  localImage,
  initialText = '',
  onTextSave,
  onClose,
}) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadImage = async () => {
      const objectUrl = await localImage.getUrlObject();
      if (mounted) setUrl(objectUrl);
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, [localImage]);

  return (
    <div className="border rounded p-3">
      <div className="d-flex gap-3" style={{ minHeight: '400px' }}>
        {/* LEFT — image */}
        <div className="flex-grow-1 border rounded d-flex align-items-center justify-content-center">
          {url ? (
            <img
              src={url}
              alt="Preview"
              className="img-fluid"
              style={{ objectFit: 'contain' }}
            />
          ) : (
            <div>Loading image…</div>
          )}
        </div>

        {/* RIGHT — header + editor */}
        <div className="flex-grow-1 d-flex flex-column">
          {/* HEADER ROW */}
          <div className="d-flex justify-content-end mb-2">
            {onClose && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={onClose}
                aria-label="Close"
              >
                ✕
              </button>
            )}
          </div>

          {/* EDITOR ROW */}
          <div className="flex-grow-1">
            <GenericTextEditor
              label="Image Notes"
              initialText={initialText}
              onSave={onTextSave}
              fitHeight
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditWindow;
