import React from 'react';
import { SortDirection } from '@tanstack/react-table';
import { ChevronDownIcon, ChevronUpDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid';

type SortingChevronsProps = {
  sorting: false | SortDirection;
};

const SortingChevrons = ({ sorting }: SortingChevronsProps) => {
  switch (sorting) {
    case 'asc':
      return <ChevronUpIcon className="w-4" />;
    case 'desc':
      return <ChevronDownIcon className="w-4" />;
    default:
      return <ChevronUpDownIcon className="w-4" />;
  }
};

export { SortingChevrons };
