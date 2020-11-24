import React, { useEffect, useState } from 'react';
import { Icon } from 'UI';
import { UserGroupSchema, GroupMemberSchema } from 'shared/types/userGroupType';
import { t, Translate } from 'app/I18N';
import { ConfirmButton, SidePanel } from 'app/Layout';
import MultiSelect from 'app/Forms/components/MultiSelect';

export interface UserGroupSidePanelProps {
  userGroup: UserGroupSchema;
  users: GroupMemberSchema[];
  opened: boolean;
  closePanel: (event: any) => void;
  onSave: (event: any) => void;
  onDelete: (event: any) => void;
}

const UserGroupSidePanelComponent = ({
  userGroup,
  users,
  opened,
  closePanel,
  onSave,
  onDelete,
}: UserGroupSidePanelProps) => {
  const [groupMembers, setGroupMembers] = useState<GroupMemberSchema[]>([]);
  const [name, setName] = useState<string>('');
  const [availableUsers, setAvailableUsers] = useState<GroupMemberSchema[]>([]);

  const sortByName = (members: GroupMemberSchema[]) =>
    members.sort((m1, m2) => (m1.username || '').localeCompare(m2.username || ''));

  function updateAvailableUsers(members: GroupMemberSchema[]) {
    const membersIds = members.map(member => member._id);
    const filteredUsers = users.filter((user: GroupMemberSchema) => !membersIds.includes(user._id));
    setAvailableUsers(sortByName(filteredUsers));
  }

  useEffect(() => {
    setName(userGroup.name);
    setGroupMembers(sortByName([...userGroup.members]));
    updateAvailableUsers(sortByName(userGroup.members));
  }, [userGroup]);

  function addUsers(userIds: string[]) {
    const addedUsers = users
      .filter((user: GroupMemberSchema) => userIds.includes(user._id as string))
      .map(user => ({
        _id: user._id,
        username: user.username,
        role: user.role,
        email: user.email,
      }));
    const updatedMembers = groupMembers.concat(addedUsers);
    setGroupMembers(updatedMembers);
    updateAvailableUsers(updatedMembers);
  }

  function removeUser(user: GroupMemberSchema) {
    const index = groupMembers.indexOf(user);
    groupMembers.splice(index, 1);
    setGroupMembers([...groupMembers]);
    updateAvailableUsers(groupMembers);
  }

  function updateGroup(event: any) {
    setName(event.target.value);
  }

  function saveGroup() {
    const groupToSave = { ...userGroup, name, members: groupMembers };
    onSave(groupToSave);
  }

  function deleteGroup() {
    onDelete(userGroup);
  }

  return (
    <SidePanel open={opened}>
      <div className="sidepanel-header">
        <Translate>{`${userGroup._id ? 'Edit' : 'Add'} Group`}</Translate>
      </div>
      <div className="sidepanel-body">
        <form id="userGroupFrom" className="user-group-form">
          <div id="name_field" className="form-group nested-selector">
            <label>
              <Translate>Name of the group</Translate>
            </label>
            <input
              type="text"
              className="form-control"
              autoComplete="off"
              value={name}
              onChange={updateGroup}
            />
          </div>
          <div className="search-box search-user nested-selector">
            <MultiSelect
              placeholder={t('System', 'Add users', null, false)}
              options={availableUsers}
              optionsLabel="username"
              optionsValue="_id"
              onChange={addUsers}
              optionsToShow={5}
            />
          </div>
          <div className="user-group-members">
            {groupMembers.map(member => (
              <div key={member._id as string} className="user-group-member">
                <div>{member.username}</div>
                <div>
                  <button
                    type="button"
                    onClick={() => removeUser(member)}
                    className="btn btn-danger btn-xs template-remove"
                  >
                    <Icon icon="trash-alt" />
                    &nbsp;
                    <span>
                      <Translate>Remove</Translate>
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </form>
      </div>
      <div className="sidepanel-footer">
        <button
          id="discardChangesBtn"
          type="button"
          className="btn btn-primary"
          onClick={closePanel}
          aria-label="Close side panel"
        >
          <Icon icon="times" />
          <span className="btn-label">
            <Translate>Discard Changes</Translate>
          </span>
        </button>
        {userGroup._id && (
          <ConfirmButton id="deleteBtn" className="btn btn-outline-danger" action={deleteGroup}>
            <Icon icon="trash-alt" />
            <span className="btn-label">
              <Translate>Delete Group</Translate>
            </span>
          </ConfirmButton>
        )}
        <button
          id="saveChangesBtn"
          type="button"
          form="userGroupFrom"
          className="btn btn-success"
          onClick={saveGroup}
        >
          <Icon icon="save" />
          <span className="btn-label">
            <Translate>{`${userGroup._id ? 'Save' : 'Create'} Group`}</Translate>
          </span>
        </button>
      </div>
    </SidePanel>
  );
};

export const UserGroupSidePanel = UserGroupSidePanelComponent;
