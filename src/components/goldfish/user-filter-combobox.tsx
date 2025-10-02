import React, { useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import { Button, Input } from '@grafana/ui';
// Popover replaced with Grafana UI Tooltip or custom implementation

interface UserFilterComboboxProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  suggestions: string[];
}

export function UserFilterCombobox({ value, onChange, suggestions }: UserFilterComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const [searchTerm, setSearchTerm] = useState(value || ''); // Used for filtering
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Update state when value prop changes
  useEffect(() => {
    setInputValue(value || '');
    setSearchTerm(value || '');
  }, [value]);

  // Deduplicate suggestions first, then filter based on searchTerm (not inputValue)
  const uniqueSuggestions = Array.from(new Set(suggestions));
  const filteredSuggestions = uniqueSuggestions.filter((user) => user.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSelect = (selectedValue: string) => {
    setInputValue(selectedValue);
    setSearchTerm(selectedValue); // Update search term too
    onChange(selectedValue);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Clear any existing debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce the search term update (1s delay)
    debounceTimer.current = setTimeout(() => {
      setSearchTerm(newValue);
      onChange(newValue || undefined);

      // Check if we should show dropdown after debounce
      const newFilteredSuggestions = uniqueSuggestions.filter((user) =>
        user.toLowerCase().includes(newValue.toLowerCase())
      );

      if (newFilteredSuggestions.length > 0) {
        setOpen(true);
      }
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Clear debounce timer and apply immediately
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      setSearchTerm(inputValue);
      onChange(inputValue || undefined);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    setInputValue('');
    setSearchTerm('');
    onChange(undefined);
    setOpen(false);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleFocus = () => {
    if (filteredSuggestions.length > 0) {
      setOpen(true);
    }
  };

  return (
    <div className="relative flex items-center">
      <Input
        type="text"
        placeholder="Filter by user..."
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={() => {
          // Small delay to allow clicking on suggestions
          setTimeout(() => {
            setOpen(false);
          }, 200);
        }}
        width={30}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-haspopup="listbox"
      />
      {inputValue && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleClear}
          type="button"
          aria-label="Clear selection"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      {open && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-[240px] border rounded bg-white shadow-lg">
          <div className="max-h-60 overflow-y-auto">
            {filteredSuggestions.map((user) => (
              <div
                key={user}
                onClick={() => handleSelect(user)}
                className="p-2 cursor-pointer hover:bg-gray-100 flex items-center"
              >
                <Check className={`mr-2 h-4 w-4 ${value === user ? 'opacity-100' : 'opacity-0'}`} />
                {user}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
