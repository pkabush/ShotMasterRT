import React from 'react';
import { observer } from 'mobx-react-lite';
import GenericTextEditor from './GenericTextEditor';
import { LocalJson } from '../classes/LocalJson';

interface EditableJsonTextFieldProps {
  localJson: LocalJson;
  field: string;
  fitHeight?: boolean;
  headerExtra?: React.ReactNode; // new optional prop
}

const EditableJsonTextField: React.FC<EditableJsonTextFieldProps> = observer(({
  localJson,
  field,
  fitHeight = false,
  headerExtra,
}) => {
  const handleSave = async (newValue: string) => {
    await localJson.updateField(field, newValue); // MobX reactive update
  };

  return (
    <GenericTextEditor
      label={field}
      initialText={localJson.data[field] ?? ''}
      onSave={handleSave}
      fitHeight={fitHeight}
      headerExtra={headerExtra} // pass it down
    />
  );
});

export default EditableJsonTextField;
