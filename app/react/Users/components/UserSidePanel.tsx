import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Icon } from 'UI';
import { t, Translate } from 'app/I18N';
import { ConfirmButton, SidePanel } from 'app/Layout';
import { UserRole } from 'shared/types/userSchema';
import { UserSchema } from 'shared/types/userType';
import { MultiSelect } from 'app/Forms/components/MultiSelect';
import { UserGroupSchema } from 'shared/types/userGroupType';
import { PermissionsList } from 'app/Users/components/PermissionsList';
import { roleTranslationKey } from '../UserManagement';

export interface UserSidePanelProps {
  user: UserSchema;
  users: UserSchema[];
  groups: UserGroupSchema[];
  opened: boolean;
  closePanel: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onSave: (user: UserSchema) => void;
  onDelete: (user: UserSchema) => void;
  onReset2fa: (user: UserSchema) => void;
  onResetPassword: (user: UserSchema) => void;
}

export const UserSidePanel = ({
  user,
  users,
  groups,
  opened,
  closePanel,
  onSave,
  onDelete,
  onReset2fa,
  onResetPassword,
}: UserSidePanelProps) => {
  const [permissionsModalOpened, setPermissionsModalOpened] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState(
    user.groups ? user.groups.map(group => group._id!.toString()) : []
  );
  const { register, handleSubmit, errors } = useForm({ defaultValues: user });
  const availableGroups = groups;
  const userRoles = Object.values(UserRole).map(role => t('System', role, null, false));

  const saveUser = (userToSave: UserSchema) => {
    const updatedGroups = groups
      .filter(group => selectedGroups.includes(group._id as string))
      .map(group => ({
        _id: group._id!,
        name: group.name,
      }));
    onSave({ ...userToSave, groups: updatedGroups });
  };
  const isUnique = (nameVal: string) =>
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
      <div className={`sidepanel-body ${user._id ? 'footer-extra-row' : ''}`}>
        <form id="userFrom" className="user-form" onSubmit={handleSubmit(saveUser)}>
          <input type="hidden" name="_id" ref={register} />
          <input type="hidden" name="using2fa" ref={register} />

          <div id="email_field" className="form-group nested-selector">
            <label>
              <Translate>Email</Translate>
            </label>
            <input
              type="email"
              className="form-control"
              autoComplete="off"
              name="email"
              ref={register({
                required: true,
                validate: isUnique,
                maxLength: 256,
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
            <select name="role" className="form-control" ref={register}>
              {userRoles.map((role: string) => (
                <option key={role} value={role}>
                  {t('System', roleTranslationKey[role], null, false)}
                </option>
              ))}
            </select>
          </div>
          <div id="username_field" className="form-group nested-selector">
            <label>
              <Translate>Username</Translate>
            </label>
            <input
              type="text"
              className="form-control"
              autoComplete="off"
              name="username"
              ref={register({
                required: true,
                validate: isUnique,
                maxLength: 50,
                minLength: 3,
              })}
            />
            {errors.username && (
              <div className="validation-error">
                <Icon icon="exclamation-triangle" size="xs" />
                {errors.username.type === 'required' && <Translate>Username is required</Translate>}
                {errors.username.type === 'validate' && <Translate>Duplicated username</Translate>}
                {errors.username.type === 'maxLength' && (
                  <Translate>Username is too long</Translate>
                )}
                {errors.username.type === 'minLength' && (
                  <Translate>Username is too short</Translate>
                )}
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
              name="password"
              ref={register({ maxLength: 50 })}
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
              onChange={groupIds => {
                setSelectedGroups(groupIds);
              }}
              optionsToShow={8}
              sortbyLabel
            />
          </div>
        </form>
        <PermissionsList isOpen={permissionsModalOpened} onClose={togglePermissionList} />
      </div>
      <div className="sidepanel-footer">
        {user._id && (
          <>
            <div className="footer-extra-row">
              <div className="btn-cluster">
                <ConfirmButton
                  id="resetPasswordBtn"
                  className="btn btn-outline-warning"
                  action={() => onResetPassword(user)}
                >
                  <Icon icon="key" />
                  <span className="btn-label">
                    <Translate>Reset Password</Translate>
                  </span>
                </ConfirmButton>
                {user.using2fa && (
                  <ConfirmButton
                    id="reset2faBtn"
                    className="btn btn-outline-danger"
                    action={() => onReset2fa(user)}
                  >
                    <Icon icon="two-factor-auth" />
                    <span className="btn-label">
                      {' '}
                      <Translate>Reset 2FA</Translate>
                    </span>
                  </ConfirmButton>
                )}
              </div>
            </div>
            <div className="btn-cluster">
              <ConfirmButton
                id="deleteBtn"
                className="btn btn-danger"
                action={() => onDelete(user)}
              >
                <Icon icon="trash-alt" />
                <span className="btn-label">
                  <Translate>Delete</Translate>
                </span>
              </ConfirmButton>
            </div>
          </>
        )}
        <div className="btn-cluster content-right">
          <button
            id="discardChangesBtn"
            type="button"
            className="btn btn-default"
            onClick={closePanel}
            aria-label="Cancel"
          >
            <span className="btn-label">
              <Translate>Cancel</Translate>
            </span>
          </button>
          <button id="saveChangesBtn" type="submit" form="userFrom" className="btn btn-success">
            <span id="submitLabel" className="btn-label">
              <Translate>Save</Translate>
            </span>
          </button>
        </div>
      </div>
    </SidePanel>
  );
};
