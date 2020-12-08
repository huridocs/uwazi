import React from 'react';
import { MemberListItem, FieldOption } from './MemberListItem';
import { MemebersListItemPermission } from './MemberListItemPermission';

interface BasicMember extends FieldOption {
  type: 'user';
  role: 'editor' | 'admin';
}

interface UserMember extends FieldOption {
  type: 'user';
  role: 'user';
  level?: 'read' | 'write' | 'mixed';
}

interface GroupMember extends FieldOption {
  type: 'group';
  level?: 'read' | 'write' | 'mixed';
}

export type MemberWithPermission = BasicMember | UserMember | GroupMember;

export const MemebersList = ({ members }: { members: MemberWithPermission[] }) => (
  <table className="members-list">
    {members.map((member: any) => (
      <tr>
        <td>
          <MemberListItem value={member} />
        </td>
        <MemebersListItemPermission role={member.role} level={member.level} />
      </tr>
    ))}
  </table>
);
