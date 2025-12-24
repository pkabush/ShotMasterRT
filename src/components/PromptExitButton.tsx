// PromptEditButton.tsx
import React from 'react';
import { observer } from 'mobx-react-lite';
import SettingsButton from './SettingsButton';
import Prompt from '../classes/Prompt';
import { models } from '../classes/ChatGPT';

type PromptValueTextareaProps = {
  initialPrompt: Prompt;
  label: string;           // key in data_local
  displayLabel?: string;   // optional display text
};

const PromptValueTextarea: React.FC<PromptValueTextareaProps> = ({
  initialPrompt,
  label,
  displayLabel = ""
}) => {
  const handleAutoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  return (
    <div className="d-flex align-items-start mb-2">
      <div className="d-flex align-items-center" style={{ width: 80 }}>
        <label
          className="form-label mb-1 me-1"
          style={{ color: initialPrompt.data_local?.[label] ? "#96d199" : undefined }}
        >
          {displayLabel || label}
        </label>

        {/*reset button??*/}
      </div>

      <textarea
        className="form-control form-control-sm"
        style={{ overflow: "hidden" }}
        value={initialPrompt.data[label]} // use getter
        rows={1}
        onChange={(e) => {
          initialPrompt.setValue(label,e.target.value);
          handleAutoResize(e);
        }}
      />
    </div>
  );
};





type PromptValueDropdownProps = {
  initialPrompt: Prompt;
  label: string;           // key in data_local or data
  displayLabel?: string;   // optional display text
  options: string[];       // dropdown options
};

const PromptValueDropdown: React.FC<PromptValueDropdownProps> = ({
  initialPrompt,
  label,
  displayLabel = "",
  options
}) => {

  return (
    <div className="d-flex mb-2">
      <label className="form-label mb-1" style={{ width: 80 }}>
        {displayLabel || label}
      </label>
      <select
        className="form-select form-select-sm"
        value={initialPrompt.data[label]}
        onChange={(e) => {initialPrompt.setValue(label,e.target.value)}}
        style={{ width: 120 }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
};




interface PromptEditButtonProps {
  initialPrompt?: Prompt | null;
  promptLabel?: string; 
}

const PromptEditButton: React.FC<PromptEditButtonProps> = observer(({ initialPrompt, promptLabel = "Generate"  }) => {
  if (!initialPrompt) return null;

  const handleClick = () => { initialPrompt.generate();};

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
            value={initialPrompt.data.preset}
            onChange={(e) => initialPrompt.applyPreset(e.target.value)}
            style={{ width: 260 }}
          >
            <option value="">-- None --</option>
            {presets.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/*Buttons*/}
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
        <div className="d-flex gap-1">
          <PromptValueDropdown initialPrompt={initialPrompt} label="provider" options={["GPT"]}/>
          <PromptValueDropdown initialPrompt={initialPrompt} label="model" options={models}/>
        </div>
        <PromptValueTextarea initialPrompt={initialPrompt} label="system_message" displayLabel="System" />
        <PromptValueTextarea initialPrompt={initialPrompt} label="prompt" displayLabel="Prompt" />


      </div>
    </SettingsButton>
    </div>
  );
});




export default PromptEditButton;
