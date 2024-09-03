/* eslint-disable max-statements */
/* eslint-disable max-lines */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useFetcher } from 'react-router-dom';
import { FetchResponseError } from 'shared/JSONRequest';
import { t, Translate } from 'app/I18N';
import { InputField, Select, MultiSelect } from 'V2/Components/Forms';
import { Button, Card, ConfirmationModal, Sidepanel } from 'V2/Components/UI';
import { validEmailFormat } from 'V2/shared/formatHelpers';
import { UserRole } from 'shared/types/userSchema';
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';
import { PermissionsListModal } from './PermissionsListModal';
import { User, Group } from '../types';

type SubmitType = 'formSubmit' | 'reset-2fa' | 'unlock-user' | 'reset-password' | undefined;

interface UserFormSidepanelProps {
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  setSelected: React.Dispatch<React.SetStateAction<User | Group | undefined>>;
  selectedUser?: User;
  users?: User[];
  groups?: Group[];
}

const userRoles = [
  { key: UserRole.ADMIN, value: UserRole.ADMIN },
  { key: UserRole.EDITOR, value: UserRole.EDITOR },
  {
    key: UserRole.COLLABORATOR,
    value: UserRole.COLLABORATOR,
  },
];

const isUnique = (nameVal: string, selectedUser?: User, users?: User[]) =>
  !users?.find(
    existingUser =>
      existingUser._id !== selectedUser?._id &&
      (existingUser.username?.trim().toLowerCase() === nameVal.trim().toLowerCase() ||
        existingUser.email?.trim().toLowerCase() === nameVal.trim().toLowerCase())
  );

const calculateSelectedGroups = (selectedGroups: string[], groups?: Group[]) =>
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
      case 'format':
      case 'required':
        return 'A valid email is required';
      case 'isUnique':
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
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const password = useRef<string>();
  const actionType = useRef<SubmitType>();
  const formSubmitRef = useRef<HTMLButtonElement>(null);

  const defaultValues =
    selectedUser ||
    ({
      username: '',
      email: '',
      password: '',
      role: 'collaborator',
      groups: [],
      rowId: 'NEW',
    } as User);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues,
    values: defaultValues,
  });

  const closeSidepanel = () => {
    setSelected(undefined);
    setShowSidepanel(false);
  };

  useEffect(() => {
    const { data: response, state } = fetcher;

    if (
      state === 'loading' &&
      response &&
      !(response instanceof FetchResponseError || response.status === 403)
    ) {
      closeSidepanel();
    }
  }, [fetcher]);

  const formSubmit = async (data: User) => {
    const formData = new FormData();
    if (data._id) {
      formData.set('intent', 'edit-user');
    } else {
      formData.set('intent', 'new-user');
    }

    formData.set('data', JSON.stringify(data));
    formData.set('confirmation', password.current || '');
    fetcher.submit(formData, { method: 'post' });
  };

  const onClickSubmit = () => {
    const formData = new FormData();
    formData.set('intent', actionType.current || '');
    formData.set('data', JSON.stringify(selectedUser));
    formData.set('confirmation', password.current || '');
    fetcher.submit(formData, { method: 'post' });
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
                      validate: {
                        isUnique: email => isUnique(email, selectedUser, users),
                        format: email => validEmailFormat(email),
                      },
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
                        onClick={() => {
                          actionType.current = 'reset-password';
                          onClickSubmit();
                        }}
                      >
                        <Translate>Reset Password</Translate>
                      </Button>

                      <Button
                        type="button"
                        styling="light"
                        onClick={() => {
                          actionType.current = 'reset-2fa';
                          setShowConfirmationModal(true);
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
                      onClick={() => {
                        actionType.current = 'unlock-user';
                        setShowConfirmationModal(true);
                      }}
                    >
                      <Translate>Unlock account</Translate>
                    </Button>
                  )}
                </div>
              </Card>

              <div className="rounded-md border border-gray-50 shadow-sm">
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
          <Sidepanel.Footer className="px-4 py-3">
            <div className="flex gap-2">
              <Button
                className="flex-grow"
                type="button"
                styling="outline"
                onClick={closeSidepanel}
              >
                <Translate>Cancel</Translate>
              </Button>
              <Button
                className="flex-grow"
                type="button"
                onClick={async () => {
                  const valid = await trigger();
                  if (valid) {
                    actionType.current = 'formSubmit';
                    setShowConfirmationModal(true);
                  }
                }}
              >
                <Translate>Save</Translate>
              </Button>
            </div>
          </Sidepanel.Footer>
          <button type="submit" hidden aria-hidden="true" disabled ref={formSubmitRef} />
        </form>
      </Sidepanel>
      <PermissionsListModal showModal={showModal} closeModal={() => setShowModal(false)} />
      {showConfirmationModal && (
        <ConfirmationModal
          header="Confirm"
          body="Confirm action"
          usePassword
          onCancelClick={() => setShowConfirmationModal(false)}
          onAcceptClick={value => {
            password.current = value;

            if (actionType.current === 'formSubmit' && formSubmitRef.current) {
              formSubmitRef.current.disabled = false;
              formSubmitRef.current.click();
              formSubmitRef.current.disabled = true;
            } else {
              onClickSubmit();
            }

            setShowConfirmationModal(false);
          }}
        />
      )}
    </>
  );
};

export { UserFormSidepanel };
