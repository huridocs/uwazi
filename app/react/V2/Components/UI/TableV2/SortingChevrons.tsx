import React from 'react';
import { SortDirection } from '@tanstack/react-table';
import { ChevronDownIcon, ChevronUpDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid';

type SortingChevronsProps = {
  sorting: false | SortDirection;
};

const SortingChevrons = ({ sorting }: SortingChevronsProps) => {
  switch (sorting) {
    case false:
      return <ChevronUpDownIcon className="ml-4 w-4" />;
    case 'asc':
      return <ChevronUpIcon className="ml-4 w-4" />;
    case 'desc':
    default:
      return <ChevronDownIcon className="ml-4 w-4" />;
  }
};

export { SortingChevrons };
