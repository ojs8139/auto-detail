"use client";

import { useRef } from 'react';
import { useDrag } from 'react-dnd';
import { cn } from '@/lib/utils';

export interface DraggableItemProps {
  id: string;
  type: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  data?: any;
}

export function DraggableItem({
  id,
  type,
  children,
  className,
  style,
  data,
  ...props
}: DraggableItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type,
    item: () => ({
      id,
      type,
      data,
    }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  drag(ref);
  
  return (
    <div
      ref={ref}
      className={cn(
        'relative cursor-move border border-transparent',
        isDragging && 'opacity-50 border-dashed border-primary',
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