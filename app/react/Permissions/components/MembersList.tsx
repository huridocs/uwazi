/* eslint-disable react/no-multi-comp */
import React from 'react';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/entityPermi... Remove this comment to see the full error message
import { MemberWithPermission } from 'shared/types/entityPermisions.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/permissionS... Remove this comment to see the full error message
import { PermissionType } from 'shared/types/permissionSchema.js';
// @ts-expect-error TS(2307): Cannot find module '../../Auth.js' or its correspo... Remove this comment to see the full error message
import { NeedAuthorization } from '../../Auth.js';
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
