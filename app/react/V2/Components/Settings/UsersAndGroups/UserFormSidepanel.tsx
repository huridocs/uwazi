/* eslint-disable max-lines */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import { useSetRecoilState } from 'recoil';
import { useForm } from 'react-hook-form';
import { useFetcher } from 'react-router-dom';
import { notificationAtom } from 'V2/atoms';
import { Translate } from 'app/I18N';
import { ClientUserGroupSchema, ClientUserSchema } from 'app/apiResponseTypes';
import { InputField, Select, MultiSelect } from 'V2/Components/Forms';
import { Button, Card, Sidepanel } from 'V2/Components/UI';
import { UserRole } from 'shared/types/userSchema';
import { ConfirmationModal } from './ConfirmationModal';

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
  const [showModal, setShowModal] = useState(false);
  const setNotifications = useSetRecoilState(notificationAtom);
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
    formState: { errors, isDirty },
    setValue,
  } = useForm({
    defaultValues,
    values: selectedUser,
  });

  const discardChangesFunction = () => {
    setSelected(undefined);
    reset(defaultValues);
    setShowSidepanel(false);
  };

  const handleSidepanelState = () => {
    if (isDirty) {
      setShowModal(true);
    } else {
      discardChangesFunction();
    }
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
    reset({}, { keepValues: true });
  };

  useEffect(() => {
    setShowSidepanel(false);

    switch (true) {
      case fetcher.formData?.get('intent') === 'new-user':
        setNotifications({
          type: 'success',
          text: <Translate>User saved</Translate>,
        });
        break;

      case fetcher.formData?.get('intent') === 'edit-user':
        setNotifications({
          type: 'success',
          text: <Translate>User updated</Translate>,
        });
        break;

      default:
        break;
    }
  }, [fetcher.data, fetcher.formData, setNotifications, setShowSidepanel]);

  return (
    <>
      <Sidepanel
        isOpen={showSidepanel}
        withOverlay
        closeSidepanelFunction={handleSidepanelState}
        title={selectedUser ? <Translate>Edit user</Translate> : <Translate>New user</Translate>}
      >
        <form onSubmit={handleSubmit(formSubmit)} className="flex flex-col h-full">
          <div className="flex-grow flex flex-col gap-4">
            <Card title={<Translate>General Information</Translate>}>
              <div className="mb-4">
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
                  {errors.username?.type === 'required' && (
                    <Translate>Username is required</Translate>
                  )}
                  {errors.username?.type === 'validate' && (
                    <Translate>Duplicated username</Translate>
                  )}
                  {errors.username?.type === 'maxLength' && (
                    <Translate>Username is too long</Translate>
                  )}
                  {errors.username?.type === 'minLength' && (
                    <Translate>Username is too short</Translate>
                  )}
                </span>
              </div>

              <Select
                label={<Translate className="font-bold block mb-1">User Role</Translate>}
                className="mb-4"
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
            </Card>

            <Card title={<Translate>Security</Translate>}>
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
                className="mb-4"
                {...register('password', { maxLength: 50 })}
              />
              <span className="text-error-700 font-bold">
                {errors.password?.type === 'maxLength' && (
                  <Translate>Password is too long</Translate>
                )}
              </span>

              {selectedUser?._id && (
                <div className="flex flex-col gap-1 w-fit md:with-full md:gap-4 md:flex-row md:justify-start">
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
                </div>
              )}
            </Card>

            <div className="border rounded-md border-gray-50 shadow-sm">
              <MultiSelect
                label={
                  <Translate className="block w-full bg-gray-50 text-primary-700 font-semibold text-lg">
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
            <Button
              className="flex-grow"
              type="button"
              styling="outline"
              onClick={handleSidepanelState}
            >
              <Translate>Cancel</Translate>
            </Button>
            <Button className="flex-grow" type="submit">
              <Translate>Save</Translate>
            </Button>
          </div>
        </form>
      </Sidepanel>

      {showModal && (
        <ConfirmationModal
          setShowModal={setShowModal}
          onConfirm={() => {
            setShowModal(false);
            discardChangesFunction();
          }}
        />
      )}
    </>
  );
};

export { UserFormSidepanel };
