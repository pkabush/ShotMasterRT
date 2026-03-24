// CollapsibleContainer.tsx
import React, { useState } from 'react';
import { Accordion } from 'react-bootstrap';
import { AccordionCard } from '../Containers/AccordionCard';

interface CollapsibleContainerProps {
  label?: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean; // optional: start collapsed
  className?: string; // optional: extra classes for container
  headerExtra?: React.ReactNode; // optional: extra content in header (right side)
  openColor?: string;
  closedColor?: string;  
  header?: React.ReactNode;
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



export const CollapsibleContainerAccordion: React.FC<CollapsibleContainerProps> = ({
  label = 'Section',  
  children,
  headerExtra,
  defaultCollapsed = false,
  openColor,
  closedColor,
  header
}) => {

  return (
    <Accordion defaultActiveKey={defaultCollapsed ? "" : label} className='mb-2'>
      <AccordionCard eventKey={label}>
        <AccordionCard.Header closedColor={closedColor} openColor={openColor}>
          {header ?? label}
          <AccordionCard.Controls>
            {headerExtra}
          </AccordionCard.Controls>
        </AccordionCard.Header>
        <AccordionCard.Body>
          {children}
        </AccordionCard.Body>
      </AccordionCard>
    </Accordion>
  );
};

export const CollapsibleAccordionCard: React.FC<CollapsibleContainerProps> = ({
  label = 'Section',  
  children,
  headerExtra,
  openColor,
  closedColor,
  header
}) => {

  return (
      <AccordionCard eventKey={label}>
        <AccordionCard.Header closedColor={closedColor} openColor={openColor}>
          {header ?? label}
          <AccordionCard.Controls>
            {headerExtra}
          </AccordionCard.Controls>
        </AccordionCard.Header>
        <AccordionCard.Body>
          {children}
        </AccordionCard.Body>
      </AccordionCard>
  );
};


