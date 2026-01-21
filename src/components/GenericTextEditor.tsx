import React, { useState, useEffect, useRef } from 'react';
import CollapsibleContainer from './Atomic/CollapsibleContainer';

export interface GenericTextEditorProps {
  label: string;
  initialText: string;
  onSave?: (newValue: string) => void;
  onEdit?: (newValue: string) => void;
  fitHeight?: boolean;
  headerExtra?: React.ReactNode; // new optional prop
}

const GenericTextEditor: React.FC<GenericTextEditorProps> = ({
  label,
  initialText,
  onSave,
  onEdit,
  fitHeight = false,
  headerExtra, // accept optional header extra
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

  const handleChange = (newText: string) => {
    setText(newText);
    if (onEdit) onEdit(newText);
  };

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    await onSave(text);
    setOriginalText(text);
    setSaving(false);
  };

  useEffect(() => {
    if (!autoSave || !hasChanges) return;
    const timeout = setTimeout(() => handleSave(), 1000);
    return () => clearTimeout(timeout);
  }, [text, autoSave, hasChanges]);

  useEffect(() => {
    if (fitHeight && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text, fitHeight]);

  // Merge default controls with optional headerExtra
  const defaultHeaderExtra = (
    <div className="d-flex align-items-center gap-2">
      {headerExtra && <>{headerExtra}</>}
      <button
        className="btn btn-primary btn-sm"
        disabled={saving || !hasChanges || !onSave}
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
    <CollapsibleContainer label={label} headerExtra={defaultHeaderExtra}>
      <textarea
        ref={textareaRef}
        className="form-control"
        style={{
          fontFamily: "monospace",
          overflowY: "auto",
          maxHeight: "800px",
        }}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
      />
    </CollapsibleContainer>
  );
};

export default GenericTextEditor;
