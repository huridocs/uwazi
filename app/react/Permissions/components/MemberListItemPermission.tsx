import React from 'react';
import { MemberWithPermission } from '../EntityPermisions';

interface MemberListItemPermissionProps {
  value: MemberWithPermission;
  onChange: (value: MemberWithPermission) => void;
  onDelete: (value: MemberWithPermission) => void;
}

const hasLevel = (member: MemberWithPermission) => ['user', 'group'].includes(member.type);

export const MemberListItemPermission = ({
  value,
  onChange,
  onDelete,
}: MemberListItemPermissionProps) => {
  const onChangeHandler = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (event.target.value === 'delete') {
      return onDelete(value);
    }

    return onChange({
      ...value,
      ...(hasLevel(value) ? { level: event.target.value as 'read' | 'write' | 'mixed' } : {}),
    });
  };

  return (
    <>
      <td>
        <span>{value.type !== 'group' ? value.role : ''}</span>
      </td>
      <td>
        {hasLevel(value) ? (
          <select value={value.level} onChange={onChangeHandler}>
            {value.level === 'mixed' ? (
              <option disabled value="mixed">
                Mixed access
              </option>
            ) : null}
            <option value="read">Can see</option>
            <option value="write">Can edit</option>
            <option value="delete">Delete</option>
          </select>
        ) : null}
      </td>
    </>
  );
};
