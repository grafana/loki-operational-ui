import React from 'react';
import { ChevronsUpDown, ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '@grafana/ui';
import { DropdownMenu } from 'components/ui/dropdown-menu';

interface DataTableColumnHeaderProps<TField extends string> {
  title: string;
  field: TField;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: TField) => void;
}

export function DataTableColumnHeader<TField extends string>({
  title,
  field,
  sortField,
  sortDirection,
  onSort,
}: DataTableColumnHeaderProps<TField>) {
  const isCurrentSort = sortField === field;

  const handleSort = (direction: 'asc' | 'desc') => {
    if (sortField === field && sortDirection === direction) {
      return;
    }
    onSort(field);
  };

  const menuItems = [
    {
      label: 'Asc',
      icon: 'arrow-up',
      onClick: () => handleSort('asc'),
    },
    {
      label: 'Desc',
      icon: 'arrow-down',
      onClick: () => handleSort('desc'),
    },
  ];

  return (
    <div className="flex items-center space-x-2">
      <DropdownMenu items={menuItems}>
        <Button variant="secondary" size="sm" fill="text">
          <div className="flex items-center">
            <span>{title}</span>
            {isCurrentSort ? (
              sortDirection === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUp className="ml-2 h-4 w-4" />
              )
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            )}
          </div>
        </Button>
      </DropdownMenu>
    </div>
  );
}
