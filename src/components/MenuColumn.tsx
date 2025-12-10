import React, { useState } from 'react';
import { SubmenuItem } from './SubmenuItem';
import type { SubmenuItemProps } from './SubmenuItem';


interface MenuColumnProps {
  title: string;
  items?: Omit<SubmenuItemProps, 'parentKey'>[];
  onClick?: () => void;
}

export const MenuColumn: React.FC<MenuColumnProps> = ({ title, items,onClick }) => {
  const [open, setOpen] = useState(false);
  const hasItems = items && items.length > 0;

  return (
    <div
      className="nav-item dropdown"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      style={{ position: 'relative' }}
    >
      <span
        className="nav-link dropdown-toggle"
        style={{ cursor: hasItems || onClick ? 'pointer' : 'default' }}
        onClick={() => {
          if (onClick) onClick(); // <-- call optional callback
        }}
      >
        {title}
      </span>

      {open && hasItems && (
        <div className="dropdown-menu show" style={{ minWidth: '180px' }}>
          {items.map((item, idx) => (
            <SubmenuItem key={idx} {...item} />
          ))}
        </div>
      )}
    </div>
  );
};
