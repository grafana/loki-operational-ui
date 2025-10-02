import React from 'react';

export const ScrollArea = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={`overflow-auto ${className || ''}`} {...props}>
      {children}
    </div>
  )
);
ScrollArea.displayName = 'ScrollArea';
