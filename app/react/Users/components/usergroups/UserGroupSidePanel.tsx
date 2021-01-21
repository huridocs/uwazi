import React, { useState } from 'react';
import { Icon } from 'UI';
import { useForm } from 'react-hook-form';
import { GroupMemberSchema, UserGroupSchema } from 'shared/types/userGroupType';
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

const sortByName = (members: GroupMemberSchema[]) =>
  members.sort((m1, m2) => (m1.username || '').localeCompare(m2.username || ''));

const mapUserIds = (users: GroupMemberSchema[]) =>
  users.map(user => (user._id ? user._id.toString() : ''));

export const UserGroupSidePanel = ({
  userGroup,
  users,
  userGroups,
  opened,
  closePanel,
  onSave,
  onDelete,
}: UserGroupSidePanelProps) => {
  const [group, setGroup] = useState<UserGroupSchema>(userGroup);
  const [values, setValues] = useState<string[]>(mapUserIds(userGroup.members));
  const { register, handleSubmit, errors } = useForm();
  const availableUsers = sortByName(users);

  const updateMembers = (userIds: string[]) => {
    const selectedUsers: GroupMemberSchema[] = users
      .filter((user: GroupMemberSchema) => userIds.includes(user._id as string))
      .map(user => ({
        _id: user._id,
        username: user.username,
        role: user.role,
        email: user.email,
      }));
    setValues(mapUserIds(selectedUsers));
    setGroup({ ...group, members: [...selectedUsers] });
  };

  const updateGroupName = (event: any) => {
    setGroup({ ...group, name: event.target.value });
  };

  const isDuplicated = (nameVal: string) =>
    !userGroups.find(
      existingGroup =>
        existingGroup._id !== userGroup._id &&
        existingGroup.name.trim().toLowerCase() === nameVal.trim().toLowerCase()
    );

  return (
    <SidePanel open={opened}>
      <div className="sidepanel-header">
        <Translate>{`${userGroup._id ? 'Edit' : 'Add'} Group`}</Translate>
      </div>
      <div className="sidepanel-body">
        <form
          id="userGroupFrom"
          className="user-group-form"
          onSubmit={handleSubmit(() => onSave(group))}
        >
          <div id="name_field" className="form-group nested-selector">
            <label>
              <Translate>Name of the group</Translate>
            </label>
            <input
              type="text"
              className="form-control"
              autoComplete="off"
              value={group.name}
              name="name"
              onChange={updateGroupName}
              ref={register({
                required: true,
                validate: isDuplicated,
                maxLength: 50,
                minLength: 3,
              })}
            />
            {errors.name && (
              <div className="validation-error">
                <Icon icon="exclamation-triangle" size="xs" />
                {errors.name.type === 'required' && <Translate>Name is required</Translate>}
                {errors.name.type === 'validate' && <Translate>Duplicated name</Translate>}
                {errors.name.type === 'maxLength' && <Translate>Name is too long</Translate>}
                {errors.name.type === 'minLength' && <Translate>Name is too short</Translate>}
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
              onChange={updateMembers}
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
          <ConfirmButton
            id="deleteBtn"
            className="btn btn-outline-danger"
            action={() => onDelete(group)}
          >
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
