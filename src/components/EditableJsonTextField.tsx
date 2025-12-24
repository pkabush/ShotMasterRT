import React from 'react';
import { observer } from 'mobx-react-lite';
import GenericTextEditor from './GenericTextEditor';
import { LocalJson } from '../classes/LocalJson';

interface EditableJsonTextFieldProps {
  localJson: LocalJson | null;
  field: string;
  fitHeight?: boolean;
  headerExtra?: React.ReactNode;
}

const EditableJsonTextField: React.FC<EditableJsonTextFieldProps> = observer(({
  localJson,
  field,
  fitHeight = false,
  headerExtra,
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
    />
  );
});

export default EditableJsonTextField;
