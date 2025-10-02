import React from 'react';
import { Checkbox as GrafanaCheckbox } from '@grafana/ui';

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ checked, onCheckedChange, disabled, id, className, ...props }, ref) => {
    return (
      <div className={className}>
        <GrafanaCheckbox
          ref={ref}
          value={checked}
          onChange={(e) => onCheckedChange?.(e.currentTarget.checked)}
          disabled={disabled}
          id={id}
          {...props}
        />
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
