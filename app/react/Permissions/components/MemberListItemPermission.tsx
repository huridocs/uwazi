import React from 'react';
import { MemberWithPermission } from 'shared/types/entityPermisions';
import { t } from 'app/I18N';

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
          {t('System', 'Mixed access', null, false)}
        </option>
      ) : null}
      <option value="read">{t('System', 'Can see', null, false)}</option>
      {value.type !== 'public' ? (
        <option value="write">{t('System', 'Can edit', null, false)}</option>
      ) : null}
      <option disabled>───────</option>
      <option value="delete">{t('System', 'Remove', null, false)}</option>
    </select>
  );
};
