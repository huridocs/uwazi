import { Translate } from 'app/I18N';
import React from 'react';
import { MemberWithPermission } from 'shared/types/entityPermisions';

interface MemberListItemPermissionProps {
  value: MemberWithPermission;
  onChange: (value: MemberWithPermission) => void;
  onDelete: (value: MemberWithPermission) => void;
}

const capitalize = (value: string) => value[0].toUpperCase() + value.slice(1);

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
      level: event.target.value as MemberWithPermission['level'],
    });
  };

  return (
    <>
      <td>
        <span>
          {value.type !== 'group' ? <Translate>{capitalize(value.role || '')}</Translate> : ''}
        </span>
      </td>
      <td>
        <select value={value.level} onChange={onChangeHandler}>
          {value.level === 'mixed' ? (
            <option disabled value="mixed">
              Mixed access
            </option>
          ) : null}
          <option value="read">Can see</option>
          <option value="write">Can edit</option>
          <option disabled>───────</option>
          <option value="delete">Delete</option>
        </select>
      </td>
    </>
  );
};
