import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import GenericTextEditor from './GenericTextEditor';
import { LocalJson } from '../classes/LocalJson';
import { Button, Form, Stack } from 'react-bootstrap';
import { Project } from '../classes/Project';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBrain, faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { AI } from '../classes/AiProviders/AI_Generic';
import { WorkflowTextModelSelect } from '../classes/AiProviders/AI_Generic_Components';

interface EditableJsonTextFieldProps {
  localJson: LocalJson | null;
  field: string;
  fitHeight?: boolean;
  headerExtra?: React.ReactNode;
  collapsed?: boolean;
  can_ask_ia?: boolean;
  label?: string;
  maxHeight?: string;
  default_value?: string;
  openColor?: string;
  closedColor?: string;
  onSave?: (newValue: string) => void;
}

const EditableJsonTextField: React.FC<EditableJsonTextFieldProps> = observer(({
  localJson,
  field,
  fitHeight = true,
  headerExtra,
  collapsed = false,
  can_ask_ia = true,
  label = null,
  maxHeight = '800px',
  default_value = '',
  openColor,
  closedColor,
  onSave,
}) => {
  if (!localJson) return;

  const [useAskUI, setUseAskAI] = useState(false);


  const handleSave = async (newValue: string) => {
    await localJson.updateField(field, newValue);
    if (onSave) await (onSave(newValue));
  };

  return (
    <GenericTextEditor
      label={label ?? field}
      initialText={localJson.getField(field) ?? default_value} // <-- use getField instead of direct access
      onSave={handleSave}
      fitHeight={fitHeight}
      maxHeight={maxHeight}
      openColor={openColor}
      closedColor={closedColor}
      headerExtra={<>
        {headerExtra}
        {can_ask_ia &&
          <>
            {false && <Form.Switch label="AskAI" checked={useAskUI} onChange={(e) => { setUseAskAI(e.target.checked) }} />}
            <Button size="sm" variant={useAskUI ? "success" : "secondary"} onClick={() => {
              setUseAskAI(!useAskUI);
            }}>
              <FontAwesomeIcon icon={faBrain} />
            </Button>
          </>
        }

      </>}
      collapsed={collapsed}
    >
      {useAskUI &&
        <AskAIView localJson={localJson} field={field} />
      }

    </GenericTextEditor>
  );
});

export default EditableJsonTextField;



interface AskAIViewProps {
  localJson: LocalJson | null;
  field: string;
}

export const AskAIView: React.FC<AskAIViewProps> = observer(({
  localJson,
  field,
}) => {
  const project = Project.getProject()
  const wf_name = "AskAI_TextEdit";

  const prompt_filed = field + "_AskAI/Prompt"
  const res_field = field + "_AskAI/response"

  return <div style={{ backgroundColor: "#3a794c" }}>
    <div className='p-2' >

      <Stack direction="horizontal" gap={3}>
        <Button size='sm' variant='success' onClick={async () => {
          const workflow = project.workflows[wf_name] ?? ""
          const prompt = `                        
                        ${localJson?.getField(field)}
            
                        ${localJson?.getField(prompt_filed)}            
                        `
          const res = await AI.GenerateText({
            prompt: prompt,
            model: workflow.model,
          })
          localJson?.updateField(res_field, res)
        }} > Ask AI</Button>

        <WorkflowTextModelSelect workflowName={wf_name} />

        <Button size='sm' variant='outline-warning' onClick={() => {
          if (!localJson) return;
          const old = localJson.getField(field);
          localJson.updateField(field, localJson.getField(res_field));
          localJson.updateField(res_field, old);
        }}
          className="ms-auto"
        >copy output</Button>
      </Stack>

      <EditableJsonTextField localJson={localJson} field={prompt_filed} can_ask_ia={false} />
      <EditableJsonTextField localJson={localJson} field={res_field} can_ask_ia={false} />

    </div>
  </div>;
});






interface EditableJsonToggleFieldProps {
  localJson: LocalJson | null;
  field: string;
  label?: string;
  default_val?: boolean;
}

export const EditableJsonToggleField: React.FC<EditableJsonToggleFieldProps> = observer(({
  localJson,
  field,
  label,
  default_val = true
}) => {
  if (!localJson) return;

  return (
    <Form.Switch label={label ?? field} checked={localJson.getField(field) ?? default_val} onChange={async (e) => {
      await localJson.updateField(field, e.target.checked);
    }} />

  );
});



export const EditableJsonToggleButton: React.FC<EditableJsonToggleFieldProps> = observer(({
  localJson,
  field,
  label,
  default_val = true
}) => {
  if (!localJson) return;

  const value = localJson.getField(field) ?? default_val;

  return (
    <Button
      size="sm"
      variant={value ? 'outline-primary' : 'outline-secondary'}
      onClick={() => {
        localJson.updateField(field, !value);
      }}
    >

      {label ?? field}       
      <FontAwesomeIcon icon={value ? faCircleCheck : faCircleXmark} style={{ marginLeft: "0.35rem" }} />
    </Button>
  );
});