import React from 'react';
import { Switch as GrafanaSwitch } from '@grafana/ui';

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ checked, onCheckedChange, disabled, id, className, ...props }, ref) => {
    return (
      <div className={className}>
        <GrafanaSwitch
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
Switch.displayName = 'Switch';

export { Switch };
