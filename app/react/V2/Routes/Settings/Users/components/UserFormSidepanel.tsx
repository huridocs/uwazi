/* eslint-disable max-lines */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { useForm } from 'react-hook-form';
import { useFetcher } from 'react-router-dom';
import { Translate } from 'app/I18N';
import { ClientUserGroupSchema, ClientUserSchema } from 'app/apiResponseTypes';
import { InputField, Select, MultiSelect } from 'V2/Components/Forms';
import { Button, Card, Sidepanel } from 'V2/Components/UI';
import { UserRole } from 'shared/types/userSchema';

interface UserFormSidepanelProps {
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  setSelected: React.Dispatch<
    React.SetStateAction<ClientUserSchema | ClientUserGroupSchema | undefined>
  >;
  selectedUser?: ClientUserSchema;
  users?: ClientUserSchema[];
  groups?: ClientUserGroupSchema[];
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
  showSidepanel,
  setShowSidepanel,
  setSelected,
  selectedUser,
  users,
  groups,
}: UserFormSidepanelProps) => {
  const fetcher = useFetcher();

  const defaultValues = {
    username: '',
    email: '',
    password: '',
    role: 'collaborator',
    groups: [],
  } as ClientUserSchema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues,
    values: selectedUser,
  });

  const closeSidepanel = () => {
    reset(defaultValues);
    setSelected(undefined);
    setShowSidepanel(false);
  };

  const formSubmit = async (data: ClientUserSchema) => {
    const formData = new FormData();
    if (data._id) {
      formData.set('intent', 'edit-user');
    } else {
      formData.set('intent', 'new-user');
    }

    formData.set('data', JSON.stringify(data));
    fetcher.submit(formData, { method: 'post' });
    setShowSidepanel(false);
    reset(defaultValues);
  };

  const handleClick = (intent: string) => {
    const formData = new FormData();
    formData.set('intent', intent);
    formData.set('data', JSON.stringify(selectedUser));
    fetcher.submit(formData, { method: 'post' });

    setShowSidepanel(false);
    reset(defaultValues);
  };

  return (
    <Sidepanel
      isOpen={showSidepanel}
      withOverlay
      closeSidepanelFunction={closeSidepanel}
      title={selectedUser ? <Translate>Edit user</Translate> : <Translate>New user</Translate>}
    >
      <form onSubmit={handleSubmit(formSubmit)} className="flex flex-col h-full">
        <div className="flex flex-col flex-grow gap-4">
          <Card title={<Translate>General Information</Translate>}>
            <div className="mb-4">
              <InputField
                label={<Translate className="block mb-1 font-bold">Username</Translate>}
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

              <span className="font-bold text-error-700">
                {errors.username?.type === 'required' && (
                  <Translate>Username is required</Translate>
                )}
                {errors.username?.type === 'validate' && <Translate>Duplicated username</Translate>}
                {errors.username?.type === 'maxLength' && (
                  <Translate>Username is too long</Translate>
                )}
                {errors.username?.type === 'minLength' && (
                  <Translate>Username is too short</Translate>
                )}
              </span>
            </div>

            <Select
              label={<Translate className="block mb-1 font-bold">User Role</Translate>}
              className="mb-4"
              id="roles"
              options={userRoles}
              {...register('role')}
            />

            <div>
              <InputField
                label={<Translate className="block mb-1 font-bold">Email</Translate>}
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

              <span className="font-bold text-error-700">
                {errors.email?.type === 'required' && <Translate>Email is required</Translate>}
                {errors.email?.type === 'validate' && <Translate>Duplicated email</Translate>}
              </span>
            </div>
          </Card>

          <Card title={<Translate>Security</Translate>}>
            <InputField
              label={
                <span className="mb-1 font-bold">
                  <Translate>Password</Translate>
                </span>
              }
              id="password"
              type="password"
              autoComplete="off"
              hasErrors={Boolean(errors.password)}
              className="mb-4"
              {...register('password', { maxLength: 50 })}
            />

            <span className="font-bold text-error-700">
              {errors.password?.type === 'maxLength' && <Translate>Password is too long</Translate>}
            </span>

            <div className="flex flex-col gap-1 w-fit md:with-full md:gap-4 md:flex-row md:justify-start">
              {selectedUser?._id && (
                <>
                  <Button
                    type="button"
                    styling="light"
                    onClick={() => {
                      console.log('this should show a confirm and then reset password');
                    }}
                  >
                    <Translate>Reset Password</Translate>
                  </Button>
                  <Button
                    type="button"
                    styling="light"
                    onClick={() => {
                      console.log('this should show a confirm and then reset 2fa');
                    }}
                  >
                    <Translate>Reset 2FA</Translate>
                  </Button>
                </>
              )}
              {selectedUser?.accountLocked && (
                <Button
                  type="button"
                  styling="light"
                  color="error"
                  onClick={() => handleClick('unlock-user')}
                >
                  <Translate>Unlock account</Translate>
                </Button>
              )}
            </div>
          </Card>

          <div className="rounded-md border border-gray-50 shadow-sm">
            <MultiSelect
              label={
                <Translate className="block w-full text-lg font-semibold bg-gray-50 text-primary-700">
                  Groups
                </Translate>
              }
              onChange={selectedGroups => {
                setValue(
                  'groups',
                  selectedGroups
                    .filter(grp => grp.selected)
                    .map(selectedGroup => {
                      const group = groups?.find(
                        originalGroup => originalGroup.name === selectedGroup.value
                      );
                      return { _id: group?._id as string, name: group?.name as string };
                    }),
                  { shouldDirty: true }
                );
              }}
              options={(groups || []).map(group => {
                const userGroups = selectedUser?.groups?.map(userGroup => userGroup.name) || [];
                if (userGroups.includes(group.name)) {
                  return { label: group.name, value: group.name, selected: true };
                }
                return { label: group.name, value: group.name };
              })}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button className="flex-grow" type="button" styling="outline" onClick={closeSidepanel}>
            <Translate>Cancel</Translate>
          </Button>
          <Button className="flex-grow" type="submit">
            <Translate>Save</Translate>
          </Button>
        </div>
      </form>
    </Sidepanel>
  );
};

export { UserFormSidepanel };
