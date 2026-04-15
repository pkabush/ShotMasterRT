import React, { useState, useEffect, useRef } from 'react';
import { CollapsibleContainerAccordion } from './Atomic/CollapsibleContainer';
import { Button, ButtonGroup, Spinner } from 'react-bootstrap';
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
  maxHeight?: string;
  openColor?: string;
  closedColor?: string;
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
  maxHeight = '800px',
  openColor,
  closedColor,
}) => {
  const [text, setText] = useState(initialText);
  const [originalText, setOriginalText] = useState(initialText);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null!);

  const needsResize = useRef(false);

  useEffect(() => {
    setText(initialText);
    setOriginalText(initialText);

    if (fitHeight && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 1}px`;
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

  useEffect(() => {
    if (!textareaRef.current) return;

    const observer = new ResizeObserver(() => {
      if (needsResize.current) {
        updateSize();
      }
    });

    observer.observe(textareaRef.current);

    return () => observer.disconnect();
  }, []);


  const updateSize = () => {
    //console.log("update_size")    
    if (textareaRef.current) {
      //console.log("update_size",textareaRef.current.scrollHeight)    
      //textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 1}px`;
      needsResize.current = (textareaRef.current.scrollHeight == 0);
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

        {true && <Button size='sm' variant='outline-primary' onClick={() => {
          console.log("Button Press", fitHeight)
          if (fitHeight && textareaRef.current) {
            console.log("Button Press Inner")
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 1}px`;
          }
        }}><FontAwesomeIcon icon={faArrowsDownToLine} /></Button>}

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

    <CollapsibleContainerAccordion
      label={label}
      headerExtra={defaultHeaderExtra}
      defaultCollapsed={collapsed}
      onToggle={(_) => {
        requestAnimationFrame(() => { updateSize(); });
      }}
      openColor={openColor}
      closedColor={closedColor}
    >
      <textarea
        ref={textareaRef}
        className="form-control"
        style={{
          fontFamily: "monospace",
          overflowY: "auto",
          maxHeight: maxHeight,
          //resize: "none"
          lineHeight: "20px",

          backgroundImage: `
      linear-gradient(to bottom, transparent 99%, rgba(255, 255, 255, 0.14) 100%)
    `,
          backgroundSize: "100% 800px",
          backgroundAttachment: "local",
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
