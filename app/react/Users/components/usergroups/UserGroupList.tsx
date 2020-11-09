import React from 'react';
import { UserGroupSchema } from 'shared/types/userGroupType';

export interface UserGroupListProps {
  userGroups: UserGroupSchema[];
}

const UserGroupListComponent = ({ userGroups }: UserGroupListProps) => (
  <table>
    <thead>
      <tr>
        <th>Name</th>
      </tr>
    </thead>
    <tbody>
      {userGroups.map((userGroup: UserGroupSchema) => (
        <tr key={userGroup._id as string}>
          <td>{userGroup.name}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export const UserGroupList = UserGroupListComponent;
