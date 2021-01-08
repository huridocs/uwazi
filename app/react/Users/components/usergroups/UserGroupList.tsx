import React, { useState } from 'react';
import { Icon } from 'UI';
import { UserGroupSchema } from 'shared/types/userGroupType';
import { Translate } from 'app/I18N';
import { Pill } from 'app/Metadata/components/Pill';

export interface UserGroupListProps {
  userGroups: UserGroupSchema[];
  handleSelect: (userGroup: UserGroupSchema) => void;
  handleAddGroup: () => void;
  className: string;
}

const UserGroupListComponent = ({
  userGroups,
  handleSelect,
  handleAddGroup,
  className,
}: UserGroupListProps) => {
  const [selectedId, setSelectedId] = useState();
  const addGroup = () => {
    setSelectedId(undefined);
    handleAddGroup();
  };
  const selectRow = (userGroup: UserGroupSchema) => {
    setSelectedId(userGroup._id);
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
          {userGroups.map((userGroup: UserGroupSchema) => (
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
        <button type="button" className="btn btn-success" onClick={addGroup}>
          <Icon icon="plus" />
          <span className="btn-label">
            <Translate>Add group</Translate>
          </span>
        </button>
      </div>
    </div>
  );
};

export const UserGroupList = UserGroupListComponent;
