import React, { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@grafana/ui';
// Command component replaced with custom dropdown implementation
// Popover replaced with Grafana UI Tooltip or custom implementation

interface TenantFilterSelectProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  tenants: string[];
}

export function TenantFilterSelect({ value, onChange, tenants }: TenantFilterSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(undefined);
  };

  const handleSelect = (tenant: string | undefined) => {
    onChange(tenant);
    setOpen(false);
    setSearchValue(''); // Reset search when selecting
  };

  // Deduplicate tenants to avoid React key warnings and sort alphabetically
  const uniqueTenants = Array.from(new Set(tenants)).sort();

  return (
    <div className="relative flex items-center">
      <div className="relative">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setOpen(!open)}
          role="combobox"
          aria-expanded={open}
        >
          {value ?? 'All Tenants'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
        {open && (
          <div className="absolute z-50 mt-1 w-[160px] border rounded bg-white shadow-lg">
            <input
              type="text"
              placeholder="Search tenants..."
              value={searchValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value)}
              className="w-full p-2 border-b"
            />
            <div className="max-h-60 overflow-y-auto">
              {(!searchValue || 'all tenants'.includes(searchValue.toLowerCase())) && (
                <div
                  onClick={() => handleSelect(undefined)}
                  className="p-2 cursor-pointer hover:bg-gray-100 flex items-center"
                >
                  <Check className={`mr-2 h-4 w-4 ${value === undefined ? 'opacity-100' : 'opacity-0'}`} />
                  All Tenants
                </div>
              )}
              {uniqueTenants
                .filter((tenant) => !searchValue || tenant.toLowerCase().includes(searchValue.toLowerCase()))
                .map((tenant) => (
                  <div
                    key={tenant}
                    onClick={() => handleSelect(tenant)}
                    className="p-2 cursor-pointer hover:bg-gray-100 flex items-center"
                  >
                    <Check className={`mr-2 h-4 w-4 ${value === tenant ? 'opacity-100' : 'opacity-0'}`} />
                    {tenant}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
      {value && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleClear}
          type="button"
          aria-label="Clear selection"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
