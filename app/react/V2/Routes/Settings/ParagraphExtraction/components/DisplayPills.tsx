import React from 'react';
import { Pill } from 'app/V2/Components/UI';

const DisplayPills = ({ items = [] }: { items: string[] }) => (
  <>
    {items.map(item => (
      <Pill key={item} color="gray" className="text-gray-900 text-xs font-medium">
        {item}
      </Pill>
    ))}
  </>
);

export { DisplayPills };
