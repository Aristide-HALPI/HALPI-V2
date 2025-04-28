import React, { useRef } from 'react';

interface ResizableBoxProps {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  onResize: (width: number, height: number) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ResizableBox: React.FC<ResizableBoxProps> = ({
  width,
  height,
  minWidth = 100,
  minHeight = 100,
  maxWidth = 1000,
  maxHeight = 1000,
  onResize,
  children,
  className = '',
  style = {},
}) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const resizing = useRef<{ dir: 'right' | 'bottom' | null; startX: number; startY: number; startW: number; startH: number } | null>(null);

  const handleMouseDown = (dir: 'right' | 'bottom') => (e: React.MouseEvent) => {
    e.preventDefault();
    resizing.current = {
      dir,
      startX: e.clientX,
      startY: e.clientY,
      startW: width,
      startH: height,
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizing.current) return;
    let newWidth = resizing.current.startW;
    let newHeight = resizing.current.startH;
    if (resizing.current.dir === 'right') {
      newWidth = Math.max(minWidth, Math.min(maxWidth, resizing.current.startW + (e.clientX - resizing.current.startX)));
    }
    if (resizing.current.dir === 'bottom') {
      newHeight = Math.max(minHeight, Math.min(maxHeight, resizing.current.startH + (e.clientY - resizing.current.startY)));
    }
    onResize(newWidth, newHeight);
  };

  const handleMouseUp = () => {
    resizing.current = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={boxRef}
      className={className}
      style={{
        ...style,
        position: 'relative',
        width,
        height,
        minWidth,
        minHeight,
        maxWidth,
        maxHeight,
        boxSizing: 'border-box',
        userSelect: resizing.current ? 'none' : undefined,
      }}
    >
      {children}
      {/* Right handle */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: 10,
          height: '100%',
          cursor: 'ew-resize',
          zIndex: 20,
        }}
        onMouseDown={handleMouseDown('right')}
      />
      {/* Bottom handle */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: '100%',
          height: 10,
          cursor: 'ns-resize',
          zIndex: 20,
        }}
        onMouseDown={handleMouseDown('bottom')}
      />
    </div>
  );
};
