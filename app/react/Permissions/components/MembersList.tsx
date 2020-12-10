import React from 'react';
import { MemberWithPermission, ValidationError } from '../EntityPermisions';
import { MemberListItem } from './MemberListItem';
import { MemberListItemPermission } from './MemberListItemPermission';

interface MemberListProps {
  members: MemberWithPermission[];
  onChange: (members: MemberWithPermission[]) => void;
  validationErrors: ValidationError[];
}

export const MembersList = ({ members, onChange, validationErrors }: MemberListProps) => {
  const onChangeHandler = (index: number) => (value: MemberWithPermission) => {
    const newMembers = [...members];
    newMembers[index] = value;
    onChange(newMembers);
  };

  const onDeleteHandler = (value: MemberWithPermission) => {
    onChange(members.filter(m => m !== value));
  };

  const hasError = (member: MemberWithPermission) =>
    !!validationErrors.find(e => e.type === member.type && e.id === member.id);

  return (
    <table className="members-list">
      {members.map((member, index) => (
        <tr
          key={`${member.type}-${member.id}`}
          className={hasError(member) ? 'validationError' : ''}
        >
          <td>
            <MemberListItem value={member} />
          </td>
          <MemberListItemPermission
            value={member}
            onChange={onChangeHandler(index)}
            onDelete={onDeleteHandler}
          />
        </tr>
      ))}
    </table>
  );
};
