import React from 'react';
import { Row } from '@tanstack/react-table';
import { Extractor } from './TableElements';

const List = ({ items }: { items: Row<Extractor>[] }) => (
  <ul className="flex flex-wrap gap-8 max-w-md list-disc list-inside">
    {items.map(item => (
      <li key={item.original._id}>{item.original.name}</li>
    ))}
  </ul>
);

export { List };
