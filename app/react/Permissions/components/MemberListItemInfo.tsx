import React from 'react';
// @ts-expect-error TS(2307): Cannot find module '../../UI.js' or its correspond... Remove this comment to see the full error message
import { Icon } from '../../UI.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/entityPermi... Remove this comment to see the full error message
import { MemberWithPermission } from 'shared/types/entityPermisions.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/permissionS... Remove this comment to see the full error message
import { PermissionType } from 'shared/types/permissionSchema.js';

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
