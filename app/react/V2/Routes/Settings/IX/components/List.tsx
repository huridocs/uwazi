import React from 'react';
import { TableExtractor } from '../types';

const List = ({ items }: { items: TableExtractor[] }) => (
  <ul className="flex flex-wrap gap-8 max-w-md list-disc list-inside">
    {items.map(item => (
      <li key={item._id}>{item.name}</li>
    ))}
  </ul>
);

export { List };
