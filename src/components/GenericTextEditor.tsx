import React, { useState, useEffect, useRef } from 'react';
import { CollapsibleContainerAccordion } from './Atomic/CollapsibleContainer';
import { Button, ButtonGroup,  Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsDownToLine, faClipboard } from '@fortawesome/free-solid-svg-icons';
import { PromptDropdownButton } from './PromptPresets/PromptDropdownButton';

export interface GenericTextEditorProps {
  label: string;
  initialText: string;
  onSave?: (newValue: string) => void;
  onEdit?: (newValue: string) => void;
  fitHeight?: boolean;
  headerExtra?: React.ReactNode; // new optional prop
  collapsed?: boolean;
  children?: React.ReactNode;
}

const GenericTextEditor: React.FC<GenericTextEditorProps> = ({
  label,
  initialText,
  onSave,
  onEdit,
  fitHeight = false,
  headerExtra, // accept optional header extra  
  collapsed = false,
  children,
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
    if (!onSave || !hasChanges) return;
    setSaving(true);
    await onSave(text);
    setOriginalText(text);
    setSaving(false);
  };

  const updateSize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 1}px`;
    }
  }

  useEffect(() => {
    if (fitHeight && textareaRef.current) { updateSize(); }
  }, [text, fitHeight]);

  // Merge default controls with optional headerExtra
  const defaultHeaderExtra = (
    <div className="d-flex align-items-center gap-2">
      {headerExtra && <>{headerExtra}</>}
      <ButtonGroup >
        <Button size='sm' variant='outline-primary' onClick={() => {
          if (fitHeight && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 1}px`;
          }
        }}><FontAwesomeIcon icon={faArrowsDownToLine} /></Button>

        <PromptDropdownButton />

        <Button size="sm" variant="outline-warning" onClick={() => { navigator.clipboard.writeText(text); }}>
          <FontAwesomeIcon icon={faClipboard} />
        </Button>

        <Button
          className="btn btn-primary btn-sm"
          disabled={saving || !hasChanges || !onSave}
          onClick={handleSave}
          style={{ width: 55 }}
        >
          {saving ? <Spinner size='sm' animation="border" role="status" /> : hasChanges ? 'Save*' : 'Save'}
        </Button>


      </ButtonGroup>
    </div >
  );

  return (

    <CollapsibleContainerAccordion label={label} headerExtra={defaultHeaderExtra} defaultCollapsed={collapsed} onToggle={(_) => {
      requestAnimationFrame(() => { updateSize(); });
    }}>
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
      {children}
    </CollapsibleContainerAccordion>

  );
};

export default GenericTextEditor;
