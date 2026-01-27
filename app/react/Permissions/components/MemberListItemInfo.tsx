import React from 'react';

import Icon from '#UI/Icon/Icon.js';

import { MemberWithPermission } from '#shared/types/entityPermisions.js';

import { PermissionType } from '#shared/types/permissionSchema.js';

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
