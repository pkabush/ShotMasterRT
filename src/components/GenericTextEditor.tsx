import React, { useState, useEffect } from 'react';

export interface GenericTextEditorProps {
  label: string;
  initialText: string;
  onSave: (newValue: string) => void;
}

const GenericTextEditor: React.FC<GenericTextEditorProps> = ({
  label,
  initialText,
  onSave
}) => {
  const [text, setText] = useState(initialText);
  const [originalText, setOriginalText] = useState(initialText);
  const [autoSave, setAutoSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Refresh when initialText changes
  useEffect(() => {
    setText(initialText);
    setOriginalText(initialText);
  }, [initialText]);

  const hasChanges = text !== originalText;

  const handleSave = async () => {
    setSaving(true);
    await onSave(text);
    setOriginalText(text);
    setSaving(false);
  };

  // Auto-save with debounce
  useEffect(() => {
    if (!autoSave) return;
    const timeout = setTimeout(() => {
      if (hasChanges) handleSave();
    }, 1000);
    return () => clearTimeout(timeout);
  }, [text, autoSave, hasChanges]);

  return (
    <div className="d-flex flex-column gap-2 border p-2 rounded">
      {/* Header row: Collapse button + Label + Save/Autosave */}
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? '▶' : '▼'}
          </button>
          <span className="fw-bold">{label}</span>
        </div>

        {!collapsed && (
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
        )}
      </div>

      {/* Textarea */}
      {!collapsed && (
        <textarea
          className="form-control"
          style={{ height: '300px', fontFamily: 'monospace' }}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      )}
    </div>
  );
};

export default GenericTextEditor;
