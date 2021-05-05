import React, { useState } from 'react';
import { MemberWithPermission } from 'shared/types/entityPermisions';
import { t } from 'app/I18N';
import { MixedAccess } from 'shared/types/permissionSchema';
import { PermissionType, AccessLevels } from '../../../shared/types/permissionSchema';

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
  const [stillIncludeMixed] = useState(value.level === MixedAccess.MIXED);

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
      {stillIncludeMixed ? (
        <option value={MixedAccess.MIXED}>{t('System', 'Mixed access', null, false)}</option>
      ) : null}
      <option value={AccessLevels.READ}>{t('System', 'Can see', null, false)}</option>
      {value.type !== PermissionType.PUBLIC ? (
        <option value={AccessLevels.WRITE}>{t('System', 'Can edit', null, false)}</option>
      ) : null}
      <option disabled>───────</option>
      <option value="delete">{t('System', 'Remove', null, false)}</option>
    </select>
  );
};
