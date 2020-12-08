import { Icon } from 'app/UI';
import React from 'react';

export interface FieldOption {
  type: 'user' | 'group';
  id: string;
  label: string;
}

interface MemberListItemProps {
  value: FieldOption;
}

export const MemberListItem = ({ value: { type, label } }: MemberListItemProps) => (
  <div className="member-list-item">
    <div className="round-icon">
      <Icon icon={type === 'user' ? 'user' : 'users'} />
    </div>
    <span>{label}</span>
  </div>
);
