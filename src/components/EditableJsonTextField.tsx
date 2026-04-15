import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import GenericTextEditor from './GenericTextEditor';
import { LocalJson } from '../classes/LocalJson';
import { Button, Form } from 'react-bootstrap';
import { Project } from '../classes/Project';
import { WorkflowOptionSelect } from './WorkflowOptionSelect';
import { AI, AllTextModels } from '../classes/AI_provider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBrain } from '@fortawesome/free-solid-svg-icons';

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
  default_value = ''
}) => {
  if (!localJson) return;

  const [useAskUI, setUseAskAI] = useState(false);


  const handleSave = async (newValue: string) => {
    await localJson.updateField(field, newValue); // uses nested path support
  };

  return (
    <GenericTextEditor
      label={label ?? field}
      initialText={localJson.getField(field) ?? default_value} // <-- use getField instead of direct access
      onSave={handleSave}
      fitHeight={fitHeight}
      maxHeight={maxHeight}
      headerExtra={<>
        {can_ask_ia &&
          <>
            <Form.Switch label="AskAI" checked={useAskUI} onChange={(e) => { setUseAskAI(e.target.checked) }} />
            <Button size="sm" variant={useAskUI ? "success" : "secondary"} onClick={() => {
              setUseAskAI(!useAskUI);
            }}>
              <FontAwesomeIcon icon={faBrain} />
            </Button>
          </>
        }

        {headerExtra}
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
  const workflowName = "AskAI_TextEdit";

  const prompt_filed = field + "_AskAI/Prompt"
  const res_field = field + "_AskAI/response"

  return <div style={{ backgroundColor: "#3a794c" }}>
    <div className='p-2' >

      <Button size='sm' variant='success' onClick={async () => {
        const workflow = project.workflows[workflowName] ?? ""
        const prompt = `                        
                        ${localJson?.getField(field)}

            
                        ${localJson?.getField(prompt_filed)}            
                        `
        const res = await AI.GenerateText({
          prompt: prompt,
          model: workflow.model ?? AllTextModels[0],
        })
        localJson?.updateField(res_field, res)
      }} > Ask AI</Button>
      <WorkflowOptionSelect
        workflowName={workflowName}
        optionName={"model"}
        values={AllTextModels}
      />

      <EditableJsonTextField localJson={localJson} field={prompt_filed} can_ask_ia={false} />
      <EditableJsonTextField localJson={localJson} field={res_field} can_ask_ia={false} />

    </div>
  </div>;
});














interface EditableJsonToggleFieldProps {
  localJson: LocalJson | null;
  field: string;
  label?: string;
}

export const EditableJsonToggleField: React.FC<EditableJsonToggleFieldProps> = observer(({
  localJson,
  field,
  label
}) => {
  if (!localJson) return;

  return (
    <Form.Switch label={label ?? field} checked={localJson.getField(field) ?? true} onChange={async (e) => {
      await localJson.updateField(field, e.target.checked);
    }} />

  );
});

