import React, { useEffect, useState } from 'react';
import GenericTextEditor from './GenericTextEditor';
import { LocalJson } from '../classes/LocalJson';

interface EditableJsonTextFieldProps {
  localJson: LocalJson;
  field: string;
  fitHeight?: boolean; // new prop
}

const EditableJsonTextField: React.FC<EditableJsonTextFieldProps> = ({
  localJson,
  field,
  fitHeight = false,
}) => {
  const [value, setValue] = useState(localJson.data[field] ?? '');

  // Update when localJson.data[field] changes
  useEffect(() => {
    setValue(localJson.data[field] ?? '');
  }, [localJson, field]);

  const handleSave = async (newValue: string) => {
    setValue(newValue);
    localJson.data[field] = newValue;
    await localJson.save();
  };

  return (
    <GenericTextEditor
      label={field}
      initialText={value}
      onSave={handleSave}
      fitHeight={fitHeight} // forward prop
    />
  );
};

export default EditableJsonTextField;
