import React from 'react';
import { Extractor } from './TableElements';

const List = ({ items }: { items: Extractor[] }) => (
  <ul className="flex flex-wrap gap-8 max-w-md list-disc list-inside">
    {items.map(item => (
      <li key={item._id}>{item.name}</li>
    ))}
  </ul>
);

export { List };
