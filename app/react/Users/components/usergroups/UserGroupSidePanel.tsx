import React, { useEffect, useState } from 'react';
import { Icon } from 'UI';
import { useForm } from 'react-hook-form';
import { UserGroupSchema, GroupMemberSchema } from 'shared/types/userGroupType';
import { t, Translate } from 'app/I18N';
import { ConfirmButton, SidePanel } from 'app/Layout';
import MultiSelect from 'app/Forms/components/MultiSelect';

export interface UserGroupSidePanelProps {
  userGroup: UserGroupSchema;
  users: GroupMemberSchema[];
  userGroups: UserGroupSchema[];
  opened: boolean;
  closePanel: (event: any) => void;
  onSave: (event: any) => void;
  onDelete: (event: any) => void;
}

const UserGroupSidePanelComponent = ({
  userGroup,
  users,
  userGroups,
  opened,
  closePanel,
  onSave,
  onDelete,
}: UserGroupSidePanelProps) => {
  const sortByName = (members: GroupMemberSchema[]) =>
    members.sort((m1, m2) => (m1.username || '').localeCompare(m2.username || ''));
  const [groupMembers, setGroupMembers] = useState<GroupMemberSchema[]>([]);
  const [name, setName] = useState<string>('');
  const [values, setValues] = useState<string[]>([]);
  const [availableUsers] = useState(sortByName(users));
  const { register, handleSubmit, errors } = useForm();

  useEffect(() => {
    setName(userGroup.name);
    setGroupMembers([...userGroup.members]);
    setValues(userGroup.members.map(user => (user._id ? user._id.toString() : '')));
  }, [userGroup]);

  function changeMembers(userIds: string[]) {
    const selectedUsers = users
      .filter((user: GroupMemberSchema) => userIds.includes(user._id as string))
      .map(user => ({
        _id: user._id,
        username: user.username,
        role: user.role,
        email: user.email,
      }));
    setValues(selectedUsers.map(user => (user._id ? user._id.toString() : '')));
    setGroupMembers(selectedUsers);
  }

  function updateGroup(event: any) {
    setName(event.target.value);
  }

  const isDuplicated = (nameVal: string) =>
    !userGroups.find(
      group =>
        group._id !== userGroup._id &&
        group.name.trim().toLowerCase() === nameVal.trim().toLowerCase()
    );

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
        <form id="userGroupFrom" className="user-group-form" onSubmit={handleSubmit(saveGroup)}>
          <div id="name_field" className="form-group nested-selector">
            <label>
              <Translate>Name of the group</Translate>
            </label>
            <input
              type="text"
              className="form-control"
              autoComplete="off"
              value={name}
              name="name"
              onChange={updateGroup}
              ref={register({ required: true, validate: isDuplicated, maxLength: 256 })}
            />
            {errors.name && (
              <div className="validation-error">
                <Icon icon="exclamation-triangle" size="xs" />
                {errors.name.type === 'required' && 'Name is required.'}
                {errors.name.type === 'validate' && 'Duplicated name.'}
                {errors.name.type === 'maxLength' && 'Name is too large.'}
              </div>
            )}
          </div>
          <div className="search-user">
            <MultiSelect
              placeholder={t('System', 'Add users', null, false)}
              options={availableUsers}
              optionsLabel="username"
              optionsValue="_id"
              value={values}
              onChange={changeMembers}
              optionsToShow={8}
              sortbyLabel
            />
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
        <button id="saveChangesBtn" type="submit" form="userGroupFrom" className="btn btn-success">
          <Icon icon="save" />
          <span id="submitLabel" className="btn-label">
            <Translate>{`${userGroup._id ? 'Save' : 'Create'} Group`}</Translate>
          </span>
        </button>
      </div>
    </SidePanel>
  );
};

export const UserGroupSidePanel = UserGroupSidePanelComponent;
