import React from 'react';
import { MemberWithPermission } from 'shared/types/entityPermisions';

interface MemberListItemPermissionProps {
  value: MemberWithPermission;
  onChange: (value: MemberWithPermission) => void;
  onDelete: (value: MemberWithPermission) => void;
  disabled?: boolean;
}

export const MemberListItemPermission = ({
  value,
  onChange,
  onDelete,
  disabled,
}: MemberListItemPermissionProps) => {
  const onChangeHandler = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (event.target.value === 'delete') {
      return onDelete(value);
    }

    return onChange({
      ...value,
      level: event.target.value as MemberWithPermission['level'],
    });
  };

  return (
    <select value={value.level} onChange={onChangeHandler} disabled={disabled}>
      {value.level === 'mixed' ? (
        <option disabled value="mixed">
          Mixed access
        </option>
      ) : null}
      <option value="read">Can see</option>
      <option value="write">Can edit</option>
      <option disabled>───────</option>
      <option value="delete">Remove</option>
    </select>
  );
};
