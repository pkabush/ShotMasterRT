import React, { useState, useEffect } from 'react';
import SettingsButton from './SettingsButton';

export interface PromptData {
  model: string;
  system_command: string;
  prompt: string;
}

interface PromptEditButtonProps {
  initialData?: PromptData;
  onChange?: (data: PromptData) => void;
  onClick: (data: PromptData) => void;
}

const PromptEditButton: React.FC<PromptEditButtonProps> = ({
  initialData,
  onChange,
  onClick,
}) => {
  const models = ['gpt-4', 'gpt-3.5-turbo'];

  const [model, setModel] = useState(initialData?.model || models[0]);
  const [systemCommand, setSystemCommand] = useState(initialData?.system_command || '');
  const [prompt, setPrompt] = useState(initialData?.prompt || '');

  useEffect(() => {
    if (initialData) {
      setModel(initialData.model);
      setSystemCommand(initialData.system_command);
      setPrompt(initialData.prompt);
    }
  }, [initialData]);

  const emitChange = (next: Partial<PromptData>) => {
    const data: PromptData = { model, system_command: systemCommand, prompt, ...next };
    onChange?.(data);
  };

  const handleClick = () => {
    const data: PromptData = { model, system_command: systemCommand, prompt };
    onClick(data);
  };

  // Auto-resize helper
  const handleAutoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto'; // reset height
    e.target.style.height = e.target.scrollHeight + 'px'; // set to content height
  };

  return (
    <SettingsButton buttonLabel="PromptEdit" onClick={handleClick}>
      <div className="w-100">
        <div className="fw-bold mb-2">PromptEdit</div>

        {/* Model dropdown */}
        <div className="mb-2">
          <label className="form-label mb-1">Model</label>
          <select
            className="form-select form-select-sm"
            value={model}
            onChange={(e) => {
              setModel(e.target.value);
              emitChange({ model: e.target.value });
            }}
          >
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* System command */}
        <div className="mb-2">
          <label className="form-label mb-1">System Command</label>
          <textarea
            className="form-control form-control-sm"
            style={{ overflow: 'hidden' }}
            value={systemCommand}
            onChange={(e) => {
              setSystemCommand(e.target.value);
              emitChange({ system_command: e.target.value });
              handleAutoResize(e);
            }}
            rows={1}
          />
        </div>

        {/* Prompt */}
        <div className="mb-2">
          <label className="form-label mb-1">Prompt</label>
          <textarea
            className="form-control form-control-sm"
            style={{ overflow: 'hidden' }}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              emitChange({ prompt: e.target.value });
              handleAutoResize(e);
            }}
            rows={1}
          />
        </div>
      </div>
    </SettingsButton>
  );
};

export default PromptEditButton;
