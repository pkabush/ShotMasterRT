// CollapsibleContainer.tsx
import React, { useState } from 'react';

interface CollapsibleContainerProps {
  label?: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean; // optional: start collapsed
  className?: string; // optional: extra classes for container
  headerExtra?: React.ReactNode; // optional: extra content in header (right side)
}

const CollapsibleContainer: React.FC<CollapsibleContainerProps> = ({
  label = 'Section',
  children,
  defaultCollapsed = false,
  className = '',
  headerExtra,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className={`border rounded p-2 mb-2 ${className}`}>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-0">
        <div className="d-flex align-items-center">
          <button
            className="btn btn-sm "
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? '▶' : '▼'}
          </button>
          <strong>{label}</strong>
        </div>

        {headerExtra && !collapsed && <div>{headerExtra}</div>}
      </div>

      {/* Collapsible content */}
      {!collapsed && <div className='mt-2'>{children}</div>}
    </div>
  );
};

export default CollapsibleContainer;
