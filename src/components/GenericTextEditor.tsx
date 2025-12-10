import React, { useState, useEffect, useRef } from 'react';
import CollapsibleContainer from './CollapsibleContainer'; // adjust path

export interface GenericTextEditorProps {
  label: string;
  initialText: string;
  onSave: (newValue: string) => void;
  fitHeight?: boolean;
}

const GenericTextEditor: React.FC<GenericTextEditorProps> = ({
  label,
  initialText,
  onSave,
  fitHeight = false,
}) => {
  const [text, setText] = useState(initialText);
  const [originalText, setOriginalText] = useState(initialText);
  const [autoSave, setAutoSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(initialText);
    setOriginalText(initialText);
    if (fitHeight && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [initialText, fitHeight]);

  const hasChanges = text !== originalText;

  const handleSave = async () => {
    setSaving(true);
    await onSave(text);
    setOriginalText(text);
    setSaving(false);
  };

  useEffect(() => {
    if (!autoSave) return;
    const timeout = setTimeout(() => {
      if (hasChanges) handleSave();
    }, 1000);
    return () => clearTimeout(timeout);
  }, [text, autoSave, hasChanges]);

  useEffect(() => {
    if (fitHeight && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text, fitHeight]);

  const headerExtra = (
    <div className="d-flex align-items-center gap-2">
      <button
        className="btn btn-primary btn-sm"
        disabled={saving || !hasChanges}
        onClick={handleSave}
      >
        {saving ? 'Saving...' : hasChanges ? 'Save*' : 'Save'}
      </button>

      <label className="d-flex align-items-center gap-1 mb-0">
        <input
          type="checkbox"
          checked={autoSave}
          onChange={(e) => setAutoSave(e.target.checked)}
        />
        Auto-save
      </label>
    </div>
  );

  return (
    <CollapsibleContainer label={label} headerExtra={headerExtra}>
      <textarea
        ref={textareaRef}
        className="form-control"
        style={{ fontFamily: 'monospace', overflow: 'hidden' }}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </CollapsibleContainer>
  );
};

export default GenericTextEditor;
