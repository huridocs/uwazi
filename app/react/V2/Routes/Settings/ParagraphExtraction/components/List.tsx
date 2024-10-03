import React from 'react';
import { TableExtractor } from '../types';

const List = ({ items }: { items: TableExtractor[] }) => (
  <ul className="flex flex-wrap gap-8 max-w-md list-disc">
    {/* what should be displayed on the confirm modal? */}
    {items.map(item => (
      <li key={item._id}>
        Templates: {item.originTemplateNames.join(', ')} - Target Template:
        {item.targetTemplateName}
      </li>
    ))}
  </ul>
);

export { List };
