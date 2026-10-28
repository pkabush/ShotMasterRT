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


interface EditableDropdownProps {
    value: string;
    onSave: (value: string) => void;
}

export const EditableDropdown: React.FC<EditableDropdownProps> = ({
    value,
    onSave,
}) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    return (
        <Form.Select
            value={localValue}
            style={{ width: "70px" }}
            size="sm"
            onChange={(e) => {
                const newValue = e.target.value;
                setLocalValue(newValue);

                if (newValue !== value) {
                    onSave(newValue);
                }
            }}
        >
            {Array.from({ length: 16 }, (_, i) => i ).map((index) => (
                <option key={index} value={index}>
                    {index}
                </option>
            ))}
        </Form.Select>
    );
};
