// PromptEditButton.tsx
import React from 'react';
import { observer } from 'mobx-react-lite';
import SettingsButton from './SettingsButton';
import Prompt from '../classes/Prompt';

interface PromptEditButtonProps {
  initialPrompt?: Prompt | null;
}

const models = ['gpt-4', 'gpt-3.5-turbo'];

const PromptEditButton: React.FC<PromptEditButtonProps> = observer(({ initialPrompt }) => {
  if (!initialPrompt) return null;

  const handleClick = () => {
    console.log('PromptEditButton clicked');
  };

  const handleAutoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const presets = Object.keys(initialPrompt.project.promptPresets || {});

  return (
    <SettingsButton buttonLabel="PromptEdit" onClick={handleClick}>
      <div className="w-100">
        <div className="fw-bold mb-2">Prompt Edit</div>

        {/* Preset Dropdown */}
        <div className="mb-2">
          <label className="form-label mb-1">Preset</label>
          <select
            className="form-select form-select-sm"
            value={initialPrompt.presetName}
            onChange={(e) => initialPrompt.applyPreset(e.target.value)}
          >
            <option value="">-- None --</option>
            {presets.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Model Dropdown */}
        <div className="mb-2">
          <label className="form-label mb-1">Model</label>
          <select
            className="form-select form-select-sm"
            value={initialPrompt.modelValue} // use getter
            onChange={(e) => initialPrompt.setModel(e.target.value)}
          >
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* System Message */}
        <div className="mb-2">
          <label className="form-label mb-1">System Message</label>
          <textarea
            className="form-control form-control-sm"
            style={{ overflow: 'hidden' }}
            value={initialPrompt.systemMessageValue} // use getter
            onChange={(e) => {
              initialPrompt.setSystemMessage(e.target.value);
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
            value={initialPrompt.promptValue} // use getter
            onChange={(e) => {
              initialPrompt.setPrompt(e.target.value);
              handleAutoResize(e);
            }}
            rows={1}
          />
        </div>

        {/* Save Buttons */}
        <div className="d-flex gap-2 mt-2">
          <button className="btn btn-sm btn-primary" onClick={() => initialPrompt.save()}>Save</button>
          <button className="btn btn-sm btn-primary" onClick={() => initialPrompt.savePreset()}>Save Preset</button>
          <button className="btn btn-sm btn-primary" onClick={() => {
            const input = prompt("Enter new preset name:");
            if (!input) return;
            initialPrompt.savePreset(input);
          }}>Save NEW Preset</button>
          <button className="btn btn-sm btn-primary" onClick={() => initialPrompt.log()}>Log</button>
        </div>
      </div>
    </SettingsButton>
  );
});

export default PromptEditButton;
