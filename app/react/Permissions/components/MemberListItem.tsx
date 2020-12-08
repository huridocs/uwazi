import { Icon } from 'app/UI';
import React from 'react';
import { MemberWithPermission } from '../EntityPermisions';

interface MemberListItemProps {
  value: MemberWithPermission;
}

export const MemberListItem = ({ value: { type, label } }: MemberListItemProps) => (
  <div className="member-list-item">
    <div className="round-icon">
      <Icon icon={type === 'user' ? 'user' : 'users'} />
    </div>
    <span>{label}</span>
  </div>
);
