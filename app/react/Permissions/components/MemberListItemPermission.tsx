import React from 'react';

export const MemebersListItemPermission = ({ role, _level }: any) => (
  <>
    <td>
      <span>{role}</span>
    </td>
    <td>
      <select>
        <option>Delete</option>
      </select>
    </td>
  </>
);
