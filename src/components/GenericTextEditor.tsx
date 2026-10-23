import React, { useState, useEffect, useRef } from 'react';
import { CollapsibleContainerAccordion } from './Atomic/CollapsibleContainer';
import { Button, ButtonGroup, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsDownToLine, faClipboard, faDownload, faPaste, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { PromptDropdownButton } from './PromptPresets/PromptDropdownButton';
import { ContextButton } from './Atomic/ContextMenu/ContextButton';

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
  const [isDragOver, setIsDragOver] = useState(false);

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
    onSave(text);
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

  const handleDownloadTxt = () => {
    const blob = new Blob([text], {
      type: 'text/plain;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const safeFilename = label
      .trim()
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
      .replace(/\s+/g, '_') || 'text';

    link.href = url;
    link.download = `${safeFilename}.txt`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

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

        <PromptDropdownButton
          onClickPreset={(presetText) => {
            setText((prev) => {
              const newText = prev
                ? `${prev}\n${presetText}`
                : presetText;
              onEdit?.(newText);
              return newText;
            });

            requestAnimationFrame(() => {
              updateSize();
              if (textareaRef.current) {
                const el = textareaRef.current;
                el.selectionStart = el.selectionEnd = el.value.length;
                el.focus();
              }
            });
          }}
        />

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

  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLTextAreaElement>) => {
    // Avoid flickering when moving within the textarea
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = Array.from(e.dataTransfer.files).find(
      (f) => f.name.toLowerCase().endsWith('.txt')
    );

    if (!file) return;

    try {
      const content = await file.text();
      handleChange(content);

      requestAnimationFrame(() => updateSize());
    } catch (error) {
      console.error('Failed to read dropped file:', error);
    }
  };

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
      context_items={<>
        <ContextButton icon={faClipboard} label='log' onSelect={() => { console.log(text) }} />

        <ContextButton icon={faArrowsDownToLine} label='Expand'
          onSelect={() => {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 1}px`;
          }}
        />

        <ContextButton icon={faClipboard} label='copy'
          onSelect={() => { navigator.clipboard.writeText(text); }}
          class_extra='warning' />

        <ContextButton
          icon={faPaste}
          label="Paste"
          onSelect={async () => {
            try {
              const clipboardText = await navigator.clipboard.readText();
              if (!clipboardText) return;
              setText(clipboardText);
              onEdit?.(clipboardText);
            } catch (error) {
              console.error('Failed to read clipboard:', error);
            }
          }}
          class_extra="warning"
        />

        <ContextButton
          icon={faDownload}
          label="Download .txt"
          onSelect={handleDownloadTxt}
          class_extra="success"
        />

        <ContextButton
          icon={faTrashCan}
          label="Clear"
          onSelect={async () => {
            setText("");
            onEdit?.("");
          }}
          class_extra="danger"
        />



      </>}
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

          border: isDragOver ? '2px dashed #0d6efd' : undefined,
          boxShadow: isDragOver ? '0 0 0 0.2rem rgba(13, 110, 253, 0.2)' : undefined,
        }}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleSave}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />

      {children}
    </CollapsibleContainerAccordion>
  );
};

export default GenericTextEditor;
