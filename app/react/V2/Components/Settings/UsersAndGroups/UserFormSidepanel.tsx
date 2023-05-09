/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
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
    formState: { errors },
  } = useForm({
    defaultValues: { username: '', email: '', password: '', groups: [] },
    values: selectedUser,
  });

  return (
    <Sidepanel
      isOpen={showSidepanel}
      withOverlay
      closeSidepanelFunction={() => {
        setSelected(undefined);
        setShowSidepanel(false);
      }}
      title={selectedUser ? <Translate>Edit user</Translate> : <Translate>New user</Translate>}
    >
      <form
        onSubmit={handleSubmit(data => {
          console.log(data);
        })}
      >
        <fieldset className="border border-slate-800 rounded-lg p-2">
          <legend>
            <Translate>General Information</Translate>
          </legend>
          <InputField
            label={<Translate>Username</Translate>}
            id="username"
            {...register('username', {
              required: true,
              validate: username => isUnique(username, selectedUser, users),
              maxLength: 50,
              minLength: 3,
            })}
          />
          <Select
            label={<Translate>User Role</Translate>}
            id="roles"
            options={userRoles}
            {...register('role')}
          />
          <InputField
            label={<Translate>Email</Translate>}
            type="email"
            id="email"
            {...register('email', {
              validate: email => isUnique(email, selectedUser, users),
              maxLength: 256,
            })}
          />
        </fieldset>

        <fieldset className="border border-slate-800 rounded-lg border-r-8 p-2">
          <legend>
            <Translate>Security</Translate>
          </legend>
          <InputField
            label={<Translate>Password</Translate>}
            id="password"
            type="password"
            autoComplete="off"
            {...register('password')}
          />
        </fieldset>

        <fieldset className="border border-slate-800 rounded-lg border-r-8 p-2">
          <legend>
            <Translate>Groups</Translate>
          </legend>
        </fieldset>

        <div>
          <Button type="button" buttonStyle="secondary">
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
