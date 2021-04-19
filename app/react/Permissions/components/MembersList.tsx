/* eslint-disable react/no-multi-comp */
import React from 'react';
import { MemberWithPermission } from 'shared/types/entityPermisions';
import { PermissionType } from 'shared/types/permissionSchema';
import { NeedAuthorization } from 'app/Auth';
import { MemberListItemInfo } from './MemberListItemInfo';
import { MemberListItemPermission } from './MemberListItemPermission';

interface MemberListProps {
  members: MemberWithPermission[];
  onChange: (members: MemberWithPermission[]) => void;
}

const notShowPublicToCollab = (member: MemberWithPermission, children: any) =>
  member.type === PermissionType.PUBLIC ? (
    <NeedAuthorization roles={['admin', 'editor']}>{children}</NeedAuthorization>
  ) : (
    children
  );

export const MembersList = ({ members, onChange }: MemberListProps) => {
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
      <tbody>
        {members.map((member, index) => (
          <tr key={`${member.type}-${member.refId}`}>
            <td>
              <MemberListItemInfo value={member} />
            </td>
            <td>
              {notShowPublicToCollab(
                member,
                <MemberListItemPermission
                  value={member}
                  onChange={onChangeHandler(index)}
                  onDelete={onDeleteHandler}
                  disabled={!member.refId}
                />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
