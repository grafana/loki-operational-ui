import React from 'react';

export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={`animate-pulse rounded-md bg-muted ${className || ''}`} {...props} />;
};
