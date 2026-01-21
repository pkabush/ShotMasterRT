// SimpleDropdown.tsx
import React from 'react';
import { Dropdown } from 'react-bootstrap';

interface Props<T> {
  items: T[];                    // list of items
  currentItem: T;                // currently selected item
  onPicked: (item: T) => void;   // callback when an item is picked
  labelRenderer?: (item: T) => React.ReactNode; // optional custom label renderer
  className?: string;             // optional extra classes
}

function SimpleDropdown<T extends string | number | { [key: string]: any }>({
  items,
  currentItem,
  onPicked,
  labelRenderer,
  className = '',
}: Props<T>) {
  return (
    <Dropdown className={className}>
      <Dropdown.Toggle variant="outline-secondary" size="sm">
        {labelRenderer ? labelRenderer(currentItem) : String(currentItem)}
      </Dropdown.Toggle>

      <Dropdown.Menu>
        {items.map((item, idx) => (
          <Dropdown.Item key={idx} onClick={() => onPicked(item)}>
            {labelRenderer ? labelRenderer(item) : String(item)}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default SimpleDropdown;
