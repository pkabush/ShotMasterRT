// src/components/SubmenuItem.tsx
import React, { useState } from 'react';

export interface SubmenuItemProps {
  name: string;
  onClick?: () => void;
  subItems?: SubmenuItemProps[];
}

export const SubmenuItem: React.FC<SubmenuItemProps> = ({ name, onClick, subItems }) => {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: 'relative' }}
    >
      <div className="dropdown-item d-flex justify-content-between" style={{ cursor: 'pointer' }} onClick={onClick}>
        {name} {subItems ? <span>▶</span> : null}
      </div>

      {subItems && hover && (
        <div
          className="dropdown-menu show"
          style={{
            position: 'absolute',
            top: 0,
            left: '100%',
            minWidth: '180px',
            zIndex: 1000,
          }}
        >
            {subItems.map((item, idx) => (
            <SubmenuItem
                key={idx}
                name={item.name}
                onClick={item.onClick}
                subItems={item.subItems}
            />
            ))}
        </div>
      )}
    </div>
  );
};
