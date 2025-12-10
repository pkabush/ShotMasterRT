import React, { useEffect, useState } from 'react';
import GenericTextEditor from './GenericTextEditor';
import { LocalJson } from '../utils/LocalJson';

interface EditableJsonTextFieldProps {
  localJson: LocalJson;
  field: string;
}

const EditableJsonTextField: React.FC<EditableJsonTextFieldProps> = ({
  localJson,
  field,
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
    />
  );
};

export default EditableJsonTextField;
