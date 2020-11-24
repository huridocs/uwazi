import React, { useState } from 'react';
import { Icon } from 'UI';
import { UserGroupSchema } from 'shared/types/userGroupType';
import { Translate } from 'app/I18N';

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
  function selectRow(userGroup: UserGroupSchema) {
    setSelectedId(userGroup._id);
    handleSelect(userGroup);
  }
  return (
    <div className="group-list">
      <table className={className}>
        <thead>
          <tr>
            <th>
              <Translate>Groups</Translate>
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
            </tr>
          ))}
        </tbody>
      </table>
      <div className={`settings-footer ${className}`}>
        <button type="button" className="btn btn-success" onClick={() => handleAddGroup()}>
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
