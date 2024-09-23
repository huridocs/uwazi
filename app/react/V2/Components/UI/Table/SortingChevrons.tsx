import React from 'react';
import { SortDirection } from '@tanstack/react-table';
import { ChevronDownIcon, ChevronUpDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid';

type SortingChevronsProps = {
  sorting: false | SortDirection;
};

const SortingChevrons = ({ sorting }: SortingChevronsProps) => {
  switch (sorting) {
    case false:
      return <ChevronUpDownIcon className="w-4" />;
    case 'asc':
      return <ChevronUpIcon className="w-4" />;
    case 'desc':
    default:
      return <ChevronDownIcon className="w-4" />;
  }
};

export { SortingChevrons };
