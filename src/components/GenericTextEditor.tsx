import React, { useState, useEffect, useRef } from 'react';
import { CollapsibleContainerAccordion } from './Atomic/CollapsibleContainer';
import { Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsDownToLine } from '@fortawesome/free-solid-svg-icons';

export interface GenericTextEditorProps {
  label: string;
  initialText: string;
  onSave?: (newValue: string) => void;
  onEdit?: (newValue: string) => void;
  fitHeight?: boolean;
  headerExtra?: React.ReactNode; // new optional prop
  collapsed?: boolean;
}

const GenericTextEditor: React.FC<GenericTextEditorProps> = ({
  label,
  initialText,
  onSave,
  onEdit,
  fitHeight = false,
  headerExtra, // accept optional header extra  
  collapsed = false,
}) => {
  const [text, setText] = useState(initialText);
  const [originalText, setOriginalText] = useState(initialText);
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
    if (fitHeight && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text, fitHeight]);

  // Merge default controls with optional headerExtra
  const defaultHeaderExtra = (
    <div className="d-flex align-items-center gap-2">
      {headerExtra && <>{headerExtra}</>}
      <Button size='sm' variant='outline-primary' onClick={() => {
        if (fitHeight && textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 1}px`;
        }
      }}><FontAwesomeIcon icon={faArrowsDownToLine} /></Button>

      <button
        className="btn btn-primary btn-sm"
        disabled={saving || !hasChanges || !onSave}
        onClick={handleSave}
      >
        {saving ? 'Saving...' : hasChanges ? 'Save*' : 'Save'}
      </button>
    </div >
  );

  return (
    <CollapsibleContainerAccordion label={label} headerExtra={defaultHeaderExtra} defaultCollapsed={collapsed}>
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
        onBlur={handleSave}
      />
    </CollapsibleContainerAccordion>
  );
};

export default GenericTextEditor;
