/* eslint-disable max-lines */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useFetcher } from 'react-router-dom';
import { t, Translate } from 'app/I18N';
import { ClientUserGroupSchema, ClientUserSchema } from 'app/apiResponseTypes';
import { InputField, Select, MultiSelect } from 'V2/Components/Forms';
import { Button, Card, Sidepanel } from 'V2/Components/UI';
import { UserRole } from 'shared/types/userSchema';
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';
import { PermissionsListModal } from './PermissionsListModal';

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

const calculateSelectedGroups = (selectedGroups: string[], groups?: ClientUserGroupSchema[]) =>
  selectedGroups.map(selectedGroup => {
    const group = groups?.find(originalGroup => originalGroup.name === selectedGroup);
    return { _id: group?._id as string, name: group?.name as string };
  });

const getFieldError = (field: 'username' | 'password' | 'email', type?: string) => {
  if (field === 'username') {
    switch (type) {
      case 'required':
        return 'Username is required';
      case 'isUnique':
        return 'Duplicated username';
      case 'maxLength':
        return 'Username is too long';
      case 'minLength':
        return 'Username is too short';
      case 'noSpaces':
        return 'Usernames cannot have spaces';
      default:
        break;
    }
  }

  if (field === 'email') {
    switch (type) {
      case 'required':
        return 'Email is required';
      case 'validate':
        return 'Duplicated email';
      default:
        break;
    }
  }

  if (field === 'password' && type) {
    return 'Password is too long';
  }

  return undefined;
};

const UserFormSidepanel = ({
  showSidepanel,
  setShowSidepanel,
  setSelected,
  selectedUser,
  users,
  groups,
}: UserFormSidepanelProps) => {
  const fetcher = useFetcher();
  const [showModal, setShowModal] = useState(false);

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

  const onClickSubmit = (intent: string) => {
    const formData = new FormData();
    formData.set('intent', intent);
    formData.set('data', JSON.stringify(selectedUser));
    fetcher.submit(formData, { method: 'post' });

    setShowSidepanel(false);
    reset(defaultValues);
  };

  return (
    <>
      <Sidepanel
        isOpen={showSidepanel}
        withOverlay
        closeSidepanelFunction={closeSidepanel}
        title={selectedUser ? <Translate>Edit user</Translate> : <Translate>New user</Translate>}
      >
        <form onSubmit={handleSubmit(formSubmit)} className="flex flex-col h-full">
          <Sidepanel.Body>
            <div className="flex flex-col flex-grow gap-4">
              <Card title={<Translate>General Information</Translate>}>
                <div className="mb-4">
                  <InputField
                    label={<Translate className="block mb-1 font-semibold">Username</Translate>}
                    id="username"
                    errorMessage={getFieldError('username', errors.username?.type)}
                    autoComplete="off"
                    className="mb-1"
                    {...register('username', {
                      required: true,
                      validate: {
                        isUnique: username => isUnique(username, selectedUser, users),
                        noSpaces: username => !/\s/.test(username),
                      },
                      maxLength: 50,
                      minLength: 3,
                    })}
                  />
                </div>

                <Select
                  label={
                    <div className="flex gap-2 mb-1 font-semibold align-middle">
                      <Translate>User Role</Translate>
                      <button type="button" onClick={() => setShowModal(true)}>
                        <span className="sr-only">{t('System', 'Permission', null, false)}</span>
                        <QuestionMarkCircleIcon className="w-5" />
                      </button>
                    </div>
                  }
                  className="mb-4"
                  id="roles"
                  options={userRoles}
                  {...register('role')}
                />

                <div>
                  <InputField
                    label={<Translate className="block mb-1 font-semibold">Email</Translate>}
                    type="email"
                    autoComplete="off"
                    id="email"
                    className="mb-1"
                    errorMessage={getFieldError('email', errors.email?.type)}
                    {...register('email', {
                      required: true,
                      validate: email => isUnique(email, selectedUser, users),
                      maxLength: 256,
                    })}
                  />
                </div>
              </Card>

              <Card title={<Translate>Security</Translate>}>
                <InputField
                  label={
                    <span className="mb-1 font-semibold">
                      <Translate>Password</Translate>
                    </span>
                  }
                  id="password"
                  type="password"
                  autoComplete="off"
                  errorMessage={getFieldError('password', errors.password?.type)}
                  className="mb-4"
                  {...register('password', { maxLength: 50 })}
                />

                <div className="flex flex-col gap-1 w-fit md:with-full md:gap-4 md:flex-row md:justify-start">
                  {selectedUser?._id && (
                    <>
                      <Button
                        type="button"
                        styling="light"
                        onClick={() => onClickSubmit('reset-password')}
                      >
                        <Translate>Reset Password</Translate>
                      </Button>

                      <Button
                        type="button"
                        styling="light"
                        onClick={() => onClickSubmit('reset-2fa')}
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
                      onClick={() => onClickSubmit('unlock-user')}
                    >
                      <Translate>Unlock account</Translate>
                    </Button>
                  )}
                </div>
              </Card>

              <div className="border rounded-md shadow-sm border-gray-50">
                <MultiSelect
                  label={
                    <Translate className="block w-full text-base font-semibold bg-gray-50 text-primary-700">
                      Groups
                    </Translate>
                  }
                  onChange={selectedGroups => {
                    const values = calculateSelectedGroups(selectedGroups, groups);
                    setValue('groups', values, { shouldDirty: true });
                  }}
                  options={groups?.map(group => ({ label: group.name, value: group.name })) || []}
                  value={selectedUser?.groups?.map(userGroup => userGroup.name) || []}
                  placeholder="Nothing selected"
                />
              </div>
            </div>
          </Sidepanel.Body>
          <Sidepanel.Footer>
            <div className="flex gap-2">
              <Button
                className="flex-grow"
                type="button"
                styling="outline"
                onClick={closeSidepanel}
              >
                <Translate>Cancel</Translate>
              </Button>
              <Button className="flex-grow" type="submit">
                <Translate>Save</Translate>
              </Button>
            </div>
          </Sidepanel.Footer>
        </form>
      </Sidepanel>
      <PermissionsListModal showModal={showModal} closeModal={() => setShowModal(false)} />
    </>
  );
};

export { UserFormSidepanel };
