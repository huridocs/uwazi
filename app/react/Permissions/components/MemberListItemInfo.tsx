import { Icon } from 'app/UI';
import React from 'react';
import { MemberWithPermission } from 'shared/types/entityPermisions';
import { PermissionType } from 'shared/types/permissionSchema';

interface MemberListItemProps {
  value: MemberWithPermission;
}

export const MemberListItemInfo = ({ value: { type, label } }: MemberListItemProps) => (
  <div className="member-list-item">
    <div className="round-icon">
      <Icon icon={type === PermissionType.USER ? 'user' : 'users'} />
    </div>
    <span>{label}</span>
  </div>
);
