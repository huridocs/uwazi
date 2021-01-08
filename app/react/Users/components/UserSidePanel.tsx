import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Icon } from 'UI';
import { Translate } from 'app/I18N';
import { ConfirmButton, SidePanel } from 'app/Layout';
import { UserRole } from 'shared/types/userSchema';
import { UserSchema } from 'shared/types/userType';
import MultiSelect from 'app/Forms/components/MultiSelect';
import { UserGroupSchema } from 'shared/types/userGroupType';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { PermissionsList } from 'app/Users/components/PermissionsList';

export interface UserSidePanelProps {
  user: UserSchema;
  users: UserSchema[];
  groups: UserGroupSchema[];
  opened: boolean;
  closePanel: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onSave: (user: UserSchema) => void;
  onDelete: (user: UserSchema) => void;
}

const mapGroupIds = (groups: { _id: ObjectIdSchema; name: string }[]) =>
  groups.map(group => (group._id ? group._id.toString() : ''));

const UserSidePanelComponent = ({
  user,
  users,
  groups,
  opened,
  closePanel,
  onSave,
  onDelete,
}: UserSidePanelProps) => {
  const [userToSave, setUserToSave] = useState(user);
  const [permissionsModalOpened, setPermissionsModalOpened] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState(user.groups ? mapGroupIds(user.groups) : []);

  const { register, handleSubmit, errors } = useForm();

  const availableGroups = groups;

  const handleInputChange = (event: React.SyntheticEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.currentTarget;
    const updatedUser = { ...userToSave, [name]: value };
    setUserToSave(updatedUser);
  };

  const onChangeHandler = (groupIds: string[]) => {
    setSelectedGroups(groupIds);
    const updatedGroups = groups
      .filter(group => groupIds.includes(group._id as string))
      .map(group => ({
        _id: group._id!,
        name: group.name,
      }));
    setUserToSave({ ...userToSave, groups: updatedGroups });
  };

  const isDuplicated = (nameVal: string) =>
    !users.find(
      existingUser =>
        existingUser._id !== user._id &&
        (existingUser.username?.trim().toLowerCase() === nameVal.trim().toLowerCase() ||
          existingUser.email?.trim().toLowerCase() === nameVal.trim().toLowerCase())
    );

  const togglePermissionList = () => {
    setPermissionsModalOpened(!permissionsModalOpened);
  };

  return (
    <SidePanel open={opened}>
      <div className="sidepanel-header">
        <Translate>{`${user._id ? 'Edit' : 'Add'} User`}</Translate>
      </div>
      <div className="sidepanel-body">
        <form id="userFrom" className="user-form" onSubmit={handleSubmit(() => onSave(userToSave))}>
          <div id="email_field" className="form-group nested-selector">
            <label>
              <Translate>Email</Translate>
            </label>
            <input
              type="text"
              className="form-control"
              autoComplete="off"
              value={userToSave.email}
              name="email"
              onChange={handleInputChange}
              ref={register({
                required: true,
                validate: isDuplicated,
                maxLength: 256,
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />
            {errors.email && (
              <div className="validation-error">
                <Icon icon="exclamation-triangle" size="xs" />
                {errors.email.type === 'required' && <Translate>Email is required</Translate>}
                {errors.email.type === 'validate' && <Translate>Duplicated email</Translate>}
                {errors.email.type === 'pattern' && <Translate>Invalid email</Translate>}
              </div>
            )}
          </div>
          <div id="role_field" className="form-group nested-selector">
            <div>
              <label>
                <Translate>Role</Translate>
              </label>
              <button
                id="role-info"
                className="role-info"
                type="button"
                onClick={togglePermissionList}
              >
                <Icon icon="info-circle" />
              </button>
            </div>
            <select
              name="role"
              className="form-control"
              onChange={handleInputChange}
              value={userToSave.role}
            >
              {Object.values(UserRole).map(role => (
                <option value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div id="name_field" className="form-group nested-selector">
            <label>
              <Translate>Username</Translate>
            </label>
            <input
              type="text"
              className="form-control"
              autoComplete="off"
              value={userToSave.username}
              name="username"
              onChange={handleInputChange}
              ref={register({
                required: true,
                validate: isDuplicated,
                maxLength: 256,
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
          <div id="password_field" className="form-group nested-selector">
            <label>
              <Translate>Password</Translate>
            </label>
            <input
              type="password"
              className="form-control"
              autoComplete="off"
              value={userToSave.password}
              name="password"
              onChange={handleInputChange}
              ref={register({ maxLength: 256 })}
            />
            {errors.password && (
              <div className="validation-error">
                <Icon icon="exclamation-triangle" size="xs" />
                {errors.password.type === 'maxLength' && (
                  <Translate>Password is too long</Translate>
                )}
              </div>
            )}
          </div>
          <div className="user-memberships">
            <label>
              <Translate>Groups</Translate>
            </label>
            <MultiSelect
              options={availableGroups}
              optionsLabel="name"
              optionsValue="_id"
              value={selectedGroups}
              onChange={onChangeHandler}
              optionsToShow={8}
              sortbyLabel
            />
          </div>
        </form>
        <PermissionsList isOpen={permissionsModalOpened} onClose={togglePermissionList} />
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
        {user._id && (
          <ConfirmButton
            id="deleteBtn"
            className="btn btn-outline-danger"
            action={() => onDelete(user)}
          >
            <Icon icon="trash-alt" />
            <span className="btn-label">
              <Translate>Delete User</Translate>
            </span>
          </ConfirmButton>
        )}
        <button id="saveChangesBtn" type="submit" form="userFrom" className="btn btn-success">
          <Icon icon="save" />
          <span id="submitLabel" className="btn-label">
            <Translate>{`${user._id ? 'Save' : 'Create'} User`}</Translate>
          </span>
        </button>
      </div>
    </SidePanel>
  );
};

export const UserSidePanel = UserSidePanelComponent;
