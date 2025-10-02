import React from 'react';

import { Check, AlertCircle } from 'lucide-react';
import { useLogLevel } from 'hooks/use-log-level';
import { Select } from '@grafana/ui';

const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;

interface LogLevelSelectProps {
  nodeName: string;
  className?: string;
}

export function LogLevelSelect({ nodeName, className }: LogLevelSelectProps) {
  const { logLevel, isLoading, error, success, setLogLevel } = useLogLevel(nodeName);

  const handleValueChange = (value: string) => {
    setLogLevel(value);
  };

  const selectOptions = LOG_LEVELS.map((level) => ({
    label: level,
    value: level,
  }));

  return (
    <div className="relative flex items-center gap-2">
      <Select
        value={logLevel}
        options={selectOptions}
        onChange={(selectableValue) => {
          if (selectableValue && selectableValue.value) {
            handleValueChange(selectableValue.value);
          }
        }}
        disabled={isLoading}
        width={20}
      />

      {/* Success/Error Indicator */}
      {(success || error) && (
        <div className={`transition-all duration-300 ease-in-out ${success || error ? 'opacity-100' : 'opacity-0'}`}>
          {success && <Check className="h-4 w-4 text-green-500" />}
          {error && <AlertCircle className="h-4 w-4 text-red-500" />}
        </div>
      )}
    </div>
  );
}
