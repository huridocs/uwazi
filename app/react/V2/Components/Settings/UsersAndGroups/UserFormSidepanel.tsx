/* eslint-disable react/jsx-props-no-spreading */
import React, { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useLoaderData } from 'react-router-dom';
import { Translate } from 'app/I18N';
import { ClientUserGroupSchema, ClientUserSchema } from 'app/apiResponseTypes';
import { InputField, Select } from 'V2/Components/Forms';
import { Button, Sidepanel } from 'V2/Components/UI';
import { UserRole } from 'shared/types/userSchema';

interface UserFormSidepanelProps {
  selectedUser?: ClientUserSchema;
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  setSelected: React.Dispatch<
    React.SetStateAction<ClientUserSchema | ClientUserGroupSchema | undefined>
  >;
}

const userRoles = [
  { key: UserRole.ADMIN, value: UserRole.ADMIN },
  { key: UserRole.EDITOR, value: UserRole.EDITOR },
  {
    key: UserRole.COLLABORATOR,
    value: UserRole.COLLABORATOR,
  },
];

const isUnique = (nameVal: string, selectedUser?: ClientUserSchema, users?: ClientUserSchema[]) =>
  !users?.find(
    existingUser =>
      existingUser._id !== selectedUser?._id &&
      (existingUser.username?.trim().toLowerCase() === nameVal.trim().toLowerCase() ||
        existingUser.email?.trim().toLowerCase() === nameVal.trim().toLowerCase())
  );

const UserFormSidepanel = ({
  selectedUser,
  showSidepanel,
  setShowSidepanel,
  setSelected,
}: UserFormSidepanelProps) => {
  const { users } = useLoaderData() as { users: ClientUserSchema[] };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    defaultValues: { username: '', email: '', password: '', groups: [] },
    values: selectedUser,
  });

  const closeSidePanel = useCallback(() => {
    setSelected(undefined);
    reset({ username: '', email: '', password: '', groups: [] });
    setShowSidepanel(false);
  }, [reset, setSelected, setShowSidepanel]);

  return (
    <Sidepanel
      isOpen={showSidepanel}
      withOverlay
      closeSidepanelFunction={closeSidePanel}
      title={selectedUser ? <Translate>Edit user</Translate> : <Translate>New user</Translate>}
    >
      <form
        onSubmit={handleSubmit(data => {
          console.log(data);
        })}
      >
        <fieldset className="p-2 mb-2">
          <legend className="mb-1">
            <Translate className="block w-full bg-gray-50 text-primary-700 font-semibold text-lg p-2">
              General Information
            </Translate>
          </legend>
          <div>
            <InputField
              label={<Translate className="font-bold block mb-1">Username</Translate>}
              id="username"
              hasErrors={Boolean(errors.username)}
              className="mb-1"
              {...register('username', {
                required: true,
                validate: username => isUnique(username, selectedUser, users),
                maxLength: 50,
                minLength: 3,
              })}
            />
            <span className="text-error-700 font-bold">
              {errors.username?.type === 'required' && <Translate>Username is required</Translate>}
              {errors.username?.type === 'validate' && <Translate>Duplicated username</Translate>}
              {errors.username?.type === 'maxLength' && <Translate>Username is too long</Translate>}
              {errors.username?.type === 'minLength' && (
                <Translate>Username is too short</Translate>
              )}
            </span>
          </div>

          <Select
            label={<Translate className="font-bold block mb-1">User Role</Translate>}
            id="roles"
            options={userRoles}
            {...register('role')}
          />

          <div>
            <InputField
              label={<Translate className="font-bold block mb-1">Email</Translate>}
              type="email"
              id="email"
              className="mb-1"
              hasErrors={Boolean(errors.email)}
              {...register('email', {
                required: true,
                validate: email => isUnique(email, selectedUser, users),
                maxLength: 256,
              })}
            />
            <span className="text-error-700 font-bold">
              {errors.email?.type === 'required' && <Translate>Email is required</Translate>}
              {errors.email?.type === 'validate' && <Translate>Duplicated email</Translate>}
            </span>
          </div>
        </fieldset>

        <fieldset className="p-2 mb-2">
          <legend className="mb-1">
            <Translate className="block w-full bg-gray-50 text-primary-700 font-semibold text-lg p-2">
              Security
            </Translate>
          </legend>
          <div>
            <InputField
              label={
                <span className="font-bold mb-1">
                  <Translate>Password</Translate>
                </span>
              }
              id="password"
              type="password"
              autoComplete="off"
              hasErrors={Boolean(errors.password)}
              className="mb-1"
              {...register('password', { maxLength: 50 })}
            />
            <span className="text-error-700 font-bold">
              {errors.password?.type === 'maxLength' && <Translate>Password is too long</Translate>}
            </span>
          </div>
        </fieldset>

        <fieldset className="p-2 mb-2">
          <legend className="mb-1">
            <Translate className="block w-full bg-gray-50 text-primary-700 font-semibold text-lg p-2">
              Groups
            </Translate>
          </legend>
        </fieldset>

        <div>
          <Button type="button" buttonStyle="secondary" onClick={closeSidePanel}>
            <Translate>Cancel</Translate>
          </Button>
          <Button type="submit" buttonStyle="primary">
            <Translate>Save</Translate>
          </Button>
        </div>
      </form>
    </Sidepanel>
  );
};

export { UserFormSidepanel };
