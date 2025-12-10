import React, { useState, useEffect, useCallback } from 'react';
import GenericTextEditor from './GenericTextEditor';

interface TextFieldProps {
  fileHandle: FileSystemFileHandle;
}

const TextField: React.FC<TextFieldProps> = ({ fileHandle }) => {
  const [fileText, setFileText] = useState<string>('');

  // Read file content on mount
  const readFile = useCallback(async () => {
    try {
      const file = await fileHandle.getFile();
      const content = await file.text();
      setFileText(content);
    } catch (err) {
      console.error('Error reading file:', err);
    }
  }, [fileHandle]);

  useEffect(() => {
    readFile();
  }, [readFile]);

  // Save function to pass to GenericTextEditor
  const saveFile = async (newText: string) => {
    try {
      let permission = await fileHandle.queryPermission({ mode: 'readwrite' });
      if (permission !== 'granted') {
        permission = await fileHandle.requestPermission({ mode: 'readwrite' });
      }

      if (permission === 'granted') {
        const writable = await fileHandle.createWritable();
        await writable.write(newText);
        await writable.close();
        setFileText(newText); // update state after save
      } else {
        console.warn('No permission to write file.');
      }
    } catch (err) {
      console.error('Error saving file:', err);
    }
  };

  return (
    <GenericTextEditor
      label={fileHandle.name}
      initialText={fileText}
      onSave={saveFile}
    />
  );
};

export default TextField;
