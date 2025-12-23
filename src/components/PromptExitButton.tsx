// PromptEditButton.tsx
import React from 'react';
import { observer } from 'mobx-react-lite';
import SettingsButton from './SettingsButton';
import Prompt from '../classes/Prompt';
import { models } from '../classes/ChatGPT';

interface PromptEditButtonProps {
  initialPrompt?: Prompt | null;
  promptLabel?: string; 
}

const PromptEditButton: React.FC<PromptEditButtonProps> = observer(({ initialPrompt, promptLabel = "Generate"  }) => {
  if (!initialPrompt) return null;

  const handleClick = () => { initialPrompt.generate();};

  const handleAutoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const presets = Object.keys(initialPrompt.project.promptPresets || {});

  return (
    <div className='my-2'>
    <SettingsButton buttonLabel={promptLabel} onClick={handleClick} isLoading={initialPrompt.isLoading}>
      <div className="w-100">

        {/* Preset Dropdown */}
        <div className="d-flex mb-2">
          <label className="form-label mb-1" style={{ width: 80 }}>Preset</label>
          <select
            className="form-select form-select-sm"
            value={initialPrompt.presetName}
            onChange={(e) => initialPrompt.applyPreset(e.target.value)}
            style={{ width: 260 }}
          >
            <option value="">-- None --</option>
            {presets.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <div className="d-flex gap-1 mx-2">
            <button className="btn btn-sm btn-primary py-1" onClick={() => initialPrompt.savePreset()}>Save Preset</button>
            <button className="btn btn-sm btn-primary py-1" onClick={() => {
              const input = prompt("Enter new preset name:");
              if (!input) return;
              initialPrompt.savePreset(input);
            }}>Save NEW Preset</button>

            <button className="btn btn-sm btn-primary py-1" onClick={() => initialPrompt.save()}>Save</button>
            <button className="btn btn-sm btn-primary py-1" onClick={() => initialPrompt.log()}>Log</button>
          </div>
        </div>

        {/* Model Dropdown */}
        <div className="d-flex mb-2">
          <label className="form-label mb-1" style={{ width: 80 }}>Model</label>
          <select
            className="form-select form-select-sm"
            value={initialPrompt.modelValue} // use getter
            onChange={(e) => initialPrompt.setModel(e.target.value)}
            style={{ width: 120 }}
          >
            {models.map((m) => (<option key={m} value={m}>{m}</option>))}
          </select>
        </div>

        {/* System Message */}
        <div className="d-flex mb-2">
          <label className="form-label mb-1" style={{ width: 80 }}>System</label>
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
        <div className="d-flex mb-2">
          <label className="form-label mb-1" style={{ width: 80 }}>Prompt</label>
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

      </div>
    </SettingsButton>
    </div>
  );
});

export default PromptEditButton;
