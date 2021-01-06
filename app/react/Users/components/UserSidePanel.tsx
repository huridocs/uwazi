import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Icon } from 'UI';
import { Translate } from 'app/I18N';
import { ConfirmButton, SidePanel } from 'app/Layout';
import { UserRole } from 'shared/types/userSchema';
import { UserSchema } from 'shared/types/userType';

export interface UserSidePanelProps {
  user: UserSchema;
  users: UserSchema[];
  opened: boolean;
  closePanel: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onSave: (user: UserSchema) => void;
  onDelete: (user: UserSchema) => void;
}
const UserSidePanelComponent = ({
  user,
  users,
  opened,
  closePanel,
  onSave,
  onDelete,
}: UserSidePanelProps) => {
  const [userToSave, setUserToSave] = useState(user);
  const { register, handleSubmit, errors } = useForm();

  const handleInputChange = (event: React.SyntheticEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.currentTarget;
    const updatedUser = { ...userToSave, [name]: value };
    setUserToSave(updatedUser);
  };

  const isDuplicated = (nameVal: string) =>
    !users.find(
      existingUser =>
        existingUser._id !== user._id &&
        existingUser.username?.trim().toLowerCase() === nameVal.trim().toLowerCase()
    );

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
              //ref={register({ required: true, validate: isDuplicated, maxLength: 256 })}
            />
          </div>
          <div id="role_field" className="form-group nested-selector">
            <label>
              <Translate>Role</Translate>
            </label>
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
              ref={register({ required: true, validate: isDuplicated, maxLength: 256 })}
            />
            {errors.name && (
              <div className="validation-error">
                <Icon icon="exclamation-triangle" size="xs" />
                {errors.name.type === 'required' && <Translate>Name is required</Translate>}
                {errors.name.type === 'validate' && <Translate>Duplicated name</Translate>}
                {errors.name.type === 'maxLength' && <Translate>Name is too long</Translate>}
              </div>
            )}
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
