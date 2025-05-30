"use client";

import { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { cn } from '@/lib/utils';

export interface DropZoneProps {
  accept: string[];
  onDrop: (item: any, position: { x: number; y: number }) => void;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function DropZone({
  accept,
  onDrop,
  children,
  className,
  style,
  ...props
}: DropZoneProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isOver, canDrop }, drop] = useDrop({
    accept,
    drop: (item, monitor) => {
      if (!ref.current) {
        return;
      }
      
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) {
        return;
      }
      
      const rect = ref.current.getBoundingClientRect();
      const x = clientOffset.x - rect.left;
      const y = clientOffset.y - rect.top;
      
      onDrop(item, { x, y });
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });
  
  drop(ref);
  
  return (
    <div
      ref={ref}
      className={cn(
        'relative',
        isOver && canDrop && 'bg-primary/10',
        canDrop && 'bg-secondary/10',
        className
      )}
      style={{
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
} 