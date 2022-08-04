import React, { useState } from 'react';
import { Icon } from 'UI';
import { useForm } from 'react-hook-form';
import { GroupMemberSchema, UserGroupSchema } from 'shared/types/userGroupType';
import { t, Translate } from 'app/I18N';
import { ConfirmButton, SidePanel } from 'app/Layout';
import { MultiSelect } from 'app/Forms/components/MultiSelect';
import { UserSchema } from 'shared/types/userType';

export interface UserGroupSidePanelProps {
  userGroup: UserGroupSchema;
  users: Partial<UserSchema>[];
  userGroups: UserGroupSchema[];
  opened: boolean;
  closePanel: (event: any) => void;
  onSave: (event: any) => void;
  onDelete: (event: any) => void;
}

const sortByName = (members: Partial<UserSchema>[]) =>
  members.sort((m1, m2) => (m1.username || '').localeCompare(m2.username || ''));

const mapUserIds = (members: GroupMemberSchema[]) =>
  members.map(member => (member.refId ? member.refId.toString() : ''));

export const UserGroupSidePanel = ({
  userGroup,
  users,
  userGroups,
  opened,
  closePanel,
  onSave,
  onDelete,
}: UserGroupSidePanelProps) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>(mapUserIds(userGroup.members));
  const { register, handleSubmit, errors } = useForm({ defaultValues: userGroup });
  const availableUsers = sortByName(users);

  const saveGroup = (groupToSave: UserGroupSchema) => {
    const updatedMembers = users
      .filter((user: Partial<UserSchema>) => selectedUsers.includes(user._id as string))
      .map(user => ({
        refId: user._id,
      }));
    onSave({ ...groupToSave, members: [...updatedMembers] });
  };

  const isUnique = (nameVal: string) =>
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
        <form id="userGroupFrom" className="user-group-form" onSubmit={handleSubmit(saveGroup)}>
          <input type="hidden" name="_id" ref={register} />
          <div id="name_field" className="form-group nested-selector">
            <label>
              <Translate>Name of the group</Translate>
            </label>
            <input
              type="text"
              className="form-control"
              autoComplete="off"
              name="name"
              ref={register({
                required: true,
                validate: isUnique,
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
              value={selectedUsers}
              onChange={usersIds => {
                setSelectedUsers(usersIds);
              }}
              optionsToShow={8}
              sortbyLabel
            />
          </div>
        </form>
      </div>
      <div className="sidepanel-footer">
        {userGroup._id && (
          <div className="btn-cluster">
            <ConfirmButton
              id="deleteBtn"
              className="btn btn-danger"
              action={() => onDelete(userGroup)}
            >
              <Icon icon="trash-alt" />
              <span className="btn-label">
                <Translate>Delete</Translate>
              </span>
            </ConfirmButton>
          </div>
        )}
        <div className="btn-cluster content-right">
          <button
            id="discardChangesBtn"
            type="button"
            className="btn btn-default"
            onClick={closePanel}
            aria-label="Close side panel"
          >
            <span className="btn-label">
              <Translate>Cancel</Translate>
            </span>
          </button>
          <button
            id="saveChangesBtn"
            type="submit"
            form="userGroupFrom"
            className="btn btn-success"
          >
            <span id="submitLabel" className="btn-label">
              <Translate>Save</Translate>
            </span>
          </button>
        </div>
      </div>
    </SidePanel>
  );
};
