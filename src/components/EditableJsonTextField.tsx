import React from 'react';
import { observer } from 'mobx-react-lite';
import GenericTextEditor from './GenericTextEditor';
import { LocalJson } from '../classes/LocalJson';
import { Form } from 'react-bootstrap';

interface EditableJsonTextFieldProps {
  localJson: LocalJson | null;
  field: string;
  fitHeight?: boolean;
  headerExtra?: React.ReactNode;
  collapsed?: boolean; 
}

const EditableJsonTextField: React.FC<EditableJsonTextFieldProps> = observer(({
  localJson,
  field,
  fitHeight = false,
  headerExtra,
  collapsed = false,
}) => {
  if (!localJson) return;

  const handleSave = async (newValue: string) => {
    await localJson.updateField(field, newValue); // uses nested path support
  };

  return (
    <GenericTextEditor
      label={field}
      initialText={localJson.getField(field) ?? ''} // <-- use getField instead of direct access
      onSave={handleSave}
      fitHeight={fitHeight}
      headerExtra={headerExtra}     
      collapsed={collapsed} 
    />
  );
});

export default EditableJsonTextField;


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

