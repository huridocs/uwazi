import React from 'react';
import { Row } from '@tanstack/react-table';
import { ClientUserGroupSchema, ClientUserSchema } from 'app/apiResponseTypes';

const ListOfItems = ({
  items,
}: {
  items: Row<ClientUserSchema>[] | Row<ClientUserGroupSchema>[];
}) => (
  <ul className="flex flex-wrap max-w-md gap-8 list-disc list-inside">
    {items.length
      ? items.map(item =>
          'username' in item.original ? (
            <li key={item.original._id}>{item.original.username}</li>
          ) : (
            <li key={item.original._id}>{item.original.name}</li>
          )
        )
      : null}
  </ul>
);

export { ListOfItems };
