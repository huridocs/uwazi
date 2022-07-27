import React, { useState } from 'react';
import { Translate } from 'app/I18N';
import { Icon } from 'app/UI';
import { Pill } from 'app/Metadata/components/Pill';
import { UserSchema } from 'shared/types/userType';
import { roleTranslationKey } from '../UserManagement';

export interface UserListProps {
  users: UserSchema[];
  handleSelect: (user: UserSchema) => void;
  handleAddUser: () => void;
  className: string;
}

export const UserList = ({ users, handleSelect, handleAddUser, className }: UserListProps) => {
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const selectRow = (user: UserSchema) => {
    handleSelect(user);
    setSelectedId(user._id?.toString());
  };
  const addUser = () => {
    setSelectedId(undefined);
    handleAddUser();
  };
  const sortedUsers = users.sort((a, b) => a.username.localeCompare(b.username));
  return (
    <div className="user-list">
      <table className={className}>
        <thead>
          <tr>
            <th>
              <Translate>Name</Translate>
            </th>
            <th>
              <Translate>Protection</Translate>
            </th>
            <th>
              <Translate>Role</Translate>
            </th>
            <th>
              <Translate>Groups</Translate>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map((user: UserSchema) => (
            <tr
              className={selectedId === user._id ? 'selected' : ''}
              key={user._id?.toString()}
              onClick={() => selectRow(user)}
            >
              <td>{user.username}</td>
              <td>
                <Pill color={user.using2fa ? 'palegreen' : 'lightgray'}>
                  <Translate translationKey="Password">Password</Translate>
                  {user.using2fa && ' + 2FA'}
                </Pill>
              </td>
              <td>
                <Pill color="white">
                  <Translate translationKey={roleTranslationKey[user.role]}>{user.role}</Translate>
                </Pill>
              </td>
              <td>
                {user.groups?.map(group => (
                  <Pill key={group._id?.toString()} color="white">
                    <>
                      <Icon icon="users" />
                      {` ${group.name}`}
                    </>
                  </Pill>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={`settings-footer ${className}`}>
        <button type="button" className="btn btn-default" onClick={addUser}>
          <Icon icon="plus" />
          <span className="btn-label">
            <Translate>Add user</Translate>
          </span>
        </button>
      </div>
    </div>
  );
};
