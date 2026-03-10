import React from 'react';
import { User, Group } from '../types';

const ListOfItems = ({ items }: { items: User[] | Group[] }) => (
  <ul className="flex flex-wrap gap-8 max-w-md list-disc list-inside">
    {items.length
      ? items.map(item =>
          'username' in item ? (
            <li key={item._id}>{item.username}</li>
          ) : (
            <li key={item._id}>{item.name}</li>
          )
        )
      : null}
  </ul>
);

export { ListOfItems };
