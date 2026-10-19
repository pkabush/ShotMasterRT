import { useEffect, useState } from "react";
import { Form } from "react-bootstrap";

interface EditableTextAreaProps {
    value: string;
    onSave: (value: string) => void;
}

export const EditableTextArea: React.FC<EditableTextAreaProps> = ({ value, onSave }) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => { setLocalValue(value); }, [value]);

    return (
        <Form.Control
            as="textarea"
            rows={4}
            value={localValue}

            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => { if (localValue !== value) { onSave(localValue); } }}
        />
    );
};