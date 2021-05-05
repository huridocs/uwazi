import React from 'react';
import { Icon } from 'app/UI';
import { MemberWithPermission } from 'shared/types/entityPermisions';
import { PermissionType } from 'shared/types/permissionSchema';

interface MemberListItemProps {
  value: MemberWithPermission;
}

const iconsMap = {
  [PermissionType.USER]: 'user',
  [PermissionType.GROUP]: 'users',
  [PermissionType.PUBLIC]: 'globe-africa',
};

export const MemberListItemInfo = ({ value: { type, label } }: MemberListItemProps) => (
  <div className="member-list-item">
    <div className="round-icon">
      <Icon icon={iconsMap[type]} />
    </div>
    <span>{label}</span>
  </div>
);
