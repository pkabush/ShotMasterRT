import React, { useState, useRef, useEffect } from 'react';

interface Props {
  initialHeight?: number;
  minHeight?: number;
  children: React.ReactNode;
}

const ResizableContainer: React.FC<Props> = ({
  initialHeight = 80,
  minHeight = 30,
  children,
}) => {
  const [height, setHeight] = useState(initialHeight);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newHeight = e.clientY - rect.top;
    if (newHeight > minHeight) setHeight(newHeight);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

    const handleHeight = 6; // same as the drag handle height

    return (
    <div
        ref={containerRef}
        className="position-relative"
        style={{ height: `${height}px` }}
    >
        <div style={{ height: '100%', paddingBottom: `${handleHeight}px`, boxSizing: 'border-box' }}>
        {children}
        </div>

        {/* Drag handle */}
        <div
        style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${handleHeight}px`,
            cursor: 'ns-resize',
            zIndex: 10,
            backgroundColor: '#0d6efd',
            opacity: 0.5,
        }}
        onMouseDown={handleMouseDown}
        />
    </div>
    );
};

export default ResizableContainer;
