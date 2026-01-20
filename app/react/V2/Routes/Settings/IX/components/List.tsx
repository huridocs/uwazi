import React from 'react';
import { TableExtractor } from '#V2/Routes/Settings/IX/types.js';

const List = ({ items }: { items: TableExtractor[] }) => (
  <ul className="flex flex-wrap gap-8 max-w-md list-disc list-inside">
    {items.map(item => (
      <li key={item._id}>{item.name}</li>
    ))}
  </ul>
);

export { List };
