import React, { useEffect, useState } from 'react';
import Split from 'react-split';
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
    localImage.getUrlObject().then(objUrl => {
      if (mounted) setUrl(objUrl);
    });
    return () => { mounted = false; };
  }, [localImage]);

  // Custom gutter element for react-split
  const gutter = (index: number, direction: 'horizontal' | 'vertical') => {
    const gutterEl = document.createElement('div');
    gutterEl.style.backgroundColor = '#8f8f8fff'; // Bootstrap primary
    gutterEl.style.opacity = '0.5';
    gutterEl.style.width = '10px';

    gutterEl.style.cursor = direction === 'horizontal' ? 'ew-resize' : 'ns-resize';
    return gutterEl;
  };

  return (
    <div className="border d-flex flex-column" style={{ height: '700px' }}>
      <Split
        sizes={[40, 60]}
        minSize={100}
        gutterSize={10} // thicker gutter
        direction="horizontal"
        style={{ display: 'flex', height: '100%', width: '100%' }}
        gutter={gutter}
      >
        {/* LEFT — image */}
        <div className="d-flex align-items-center justify-content-center overflow-hidden">
          {url ? (
            <img
              src={url}
              alt="Preview"
              className="img-fluid"
              style={{ objectFit: 'contain', maxHeight: '100%', maxWidth: '100%' }}
            />
          ) : (
            <div>Loading image…</div>
          )}
        </div>

        {/* RIGHT — header + editor */}
        <div className="d-flex flex-column h-100 p-3">
          {/* Header */}
          <div className="d-flex justify-content-end mb-2">
            {onClose && (
              <button type="button" className="btn btn-danger btn-sm" onClick={onClose}>
                ✕
              </button>
            )}
          </div>

          {/* Editor */}
          <div className="flex-grow-1 overflow-hidden">
            <GenericTextEditor
              label="Image Notes"
              initialText={initialText}
              onSave={onTextSave}
              fitHeight
            />
          </div>
        </div>
      </Split>
    </div>
  );
};

export default ImageEditWindow;
