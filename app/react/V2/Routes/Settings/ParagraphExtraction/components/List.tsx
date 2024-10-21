import React from 'react';
import { Translate } from 'app/I18N';
import { PXTable } from '../types';

const List = ({ items }: { items: PXTable[] }) => (
  <ul className="flex flex-wrap gap-8 max-w-md list-disc">
    {items.map(item => (
      <li key={item._id}>
        <Translate>Templates: </Translate>
        {item.originTemplateNames.join(', ')}
        <Translate>Target Template:</Translate>
        {item.targetTemplateName}
      </li>
    ))}
  </ul>
);

export { List };
