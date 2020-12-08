import React from 'react';
import { MemberWithPermission } from '../EntityPermisions';
import { MemberListItem } from './MemberListItem';
import { MemberListItemPermission } from './MemberListItemPermission';

export const MemebersList = ({
  members,
  onChange,
}: {
  members: MemberWithPermission[];
  onChange: (members: MemberWithPermission[]) => void;
}) => {
  const onChangeHandler = (index: number) => (value: MemberWithPermission) => {
    const newMembers = [...members];
    newMembers[index] = value;
    onChange(newMembers);
  };

  const onDeleteHandler = (value: MemberWithPermission) => {
    onChange(members.filter(m => m !== value));
  };

  return (
    <table className="members-list">
      {members.map((member, index) => (
        <tr>
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
