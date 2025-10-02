import React from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { Button, useStyles2, Checkbox } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

export interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function MultiSelect({
  options = [],
  selected = [],
  onChange,
  placeholder = 'Select options...',
  emptyMessage = 'No options found.',
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const styles = useStyles2(getStyles);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value];
    onChange(newSelected);
  };

  const handleSelectAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((option) => option.value));
    }
  };

  const selectedCount = selected.length;
  const totalOptions = options.length;

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        const dropdown = document.getElementById('multi-select-dropdown');
        if (dropdown && !dropdown.contains(event.target as Node)) {
          setOpen(false);
        }
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className={className} style={{ position: 'relative' }}>
      <Button
        ref={buttonRef}
        variant="secondary"
        fill="outline"
        onClick={() => setOpen(!open)}
        className={styles.button}
      >
        {selectedCount === 0 ? placeholder : `${selectedCount} selected`}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" style={{ marginLeft: '8px' }} />
      </Button>
      {open && (
        <div id="multi-select-dropdown" className={styles.dropdown}>
          <input
            type="text"
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <div className={styles.optionsList}>
            {filteredOptions.length === 0 ? (
              <div className={styles.emptyMessage}>{emptyMessage}</div>
            ) : (
              <>
                {totalOptions > 0 && (
                  <div className={styles.option} onClick={handleSelectAll}>
                    <Checkbox
                      value={selectedCount > 0 && selectedCount === totalOptions}
                      onChange={handleSelectAll}
                      label="Select all"
                    />
                  </div>
                )}
                {filteredOptions.map((option) => (
                  <div key={option.value} className={styles.option} onClick={() => handleSelect(option.value)}>
                    <Checkbox
                      value={selected.includes(option.value)}
                      onChange={() => handleSelect(option.value)}
                      label={option.label}
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  button: css`
    width: 100%;
    justify-content: space-between;
  `,
  dropdown: css`
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 1000;
    background: ${theme.colors.background.primary};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.radius.default};
    box-shadow: ${theme.shadows.z3};
    max-height: 300px;
    display: flex;
    flex-direction: column;
  `,
  searchInput: css`
    padding: ${theme.spacing(1)};
    border: none;
    border-bottom: 1px solid ${theme.colors.border.weak};
    background: ${theme.colors.background.primary};
    color: ${theme.colors.text.primary};
    font-size: ${theme.typography.fontSize};
    outline: none;
    &:focus {
      border-bottom-color: ${theme.colors.primary.border};
    }
  `,
  optionsList: css`
    overflow-y: auto;
    padding: ${theme.spacing(0.5)};
  `,
  option: css`
    padding: ${theme.spacing(1)};
    cursor: pointer;
    border-radius: ${theme.shape.radius.default};
    &:hover {
      background: ${theme.colors.background.secondary};
    }
  `,
  emptyMessage: css`
    padding: ${theme.spacing(2)};
    text-align: center;
    color: ${theme.colors.text.secondary};
  `,
});
