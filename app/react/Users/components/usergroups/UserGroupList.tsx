import React, { useState } from 'react';
import { Icon } from 'UI';
import { ClientUserGroupSchema } from 'app/apiResponseTypes';
import { Translate } from 'app/I18N';
import { Pill } from 'app/Metadata/components/Pill';

export interface UserGroupListProps {
  userGroups: ClientUserGroupSchema[];
  handleSelect: (userGroup: ClientUserGroupSchema) => void;
  handleAddGroup: () => void;
  className: string;
}

export const UserGroupList = ({
  userGroups,
  handleSelect,
  handleAddGroup,
  className,
}: UserGroupListProps) => {
  const [selectedId, setSelectedId] = useState<string | undefined>('');
  const addGroup = () => {
    setSelectedId(undefined);
    handleAddGroup();
  };
  const selectRow = (userGroup: ClientUserGroupSchema) => {
    setSelectedId(userGroup._id?.toString());
    handleSelect(userGroup);
  };
  return (
    <div className="group-list">
      <table className={className}>
        <thead>
          <tr>
            <th>
              <Translate>Groups</Translate>
            </th>
            <th align="center">
              <Translate>Members</Translate>
            </th>
          </tr>
        </thead>
        <tbody>
          {userGroups.map((userGroup: ClientUserGroupSchema) => (
            <tr
              className={selectedId === userGroup._id ? 'selected' : ''}
              key={userGroup._id as string}
              onClick={() => selectRow(userGroup)}
            >
              <td>{userGroup.name}</td>
              <td align="center">
                <Pill color="white">
                  <>
                    <Icon icon="users" />
                    {` ${userGroup.members.length}`}
                  </>
                </Pill>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={`settings-footer ${className}`}>
        <button type="button" className="btn btn-default" onClick={addGroup}>
          <Icon icon="plus" />
          <span className="btn-label">
            <Translate>Add group</Translate>
          </span>
        </button>
      </div>
    </div>
  );
};
