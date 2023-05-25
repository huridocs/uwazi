/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { Translate } from 'app/I18N';
import { RequestParams } from 'app/utils/RequestParams';
import UsersAPI from 'app/Users/UsersAPI';
import { NavigationHeader } from 'V2/Components/UI/NavigationHeader';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import { UserSchema } from 'shared/types/userType';
import { InputField } from 'app/V2/Components/Forms';
import { Button, Sidepanel } from 'app/V2/Components/UI';
import { useForm } from 'react-hook-form';
import { User } from 'api/users.v2/model/User';

const accountLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    UsersAPI.currentUser(new RequestParams({}, headers));

const Account = () => {
  const userAccount = useLoaderData() as UserSchema;
  const [isSidepanelOpen, setIsSidepanelOpen] = useState(false);

  type AccountForm = UserSchema & { passwordConfirm?: string };
  const {
    register,
    watch,
    handleSubmit,
    setValue,
    getFieldState,
    reset,
    formState: { isDirty, errors, isSubmitting },
  } = useForm<AccountForm>({
    defaultValues: userAccount,
    mode: 'onSubmit',
  });

  const submit = async (data: AccountForm) => {
    console.log(data);
  };
  console.log(errors);
  return (
    <div
      className="tw-content"
      style={{ width: '100%', overflowY: 'auto' }}
      data-testid="settings-languages"
    >
      <div className="flex flex-col h-full">
        <div className="flex-grow p-5">
          <NavigationHeader backUrl="/settings">
            <h1 className="text-base text-gray-700">
              <Translate>Account</Translate>
            </h1>
          </NavigationHeader>
          <form onSubmit={handleSubmit(submit)} id="account-form">
            <div className="shadow-md sm:rounded-lg p-5 mb-4">
              <h2 className="text-m font-semibold text-primary-700 bg-gray-50 -mt-5 -mx-5 p-4 mb-5">
                <Translate>General Information</Translate>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                <div className="sm:col-span-1">
                  <InputField
                    id="account-username"
                    label={<Translate>Username</Translate>}
                    value={userAccount.username}
                    disabled
                  />
                </div>
                <div className="sm:col-span-1">
                  <InputField
                    id="account-role"
                    label={<Translate>User Role</Translate>}
                    value={userAccount.role}
                    disabled
                  />
                </div>
                <div className="col-span-2">
                  <InputField
                    id="account-email"
                    label={<Translate>Email</Translate>}
                    {...register('email', { required: true })}
                  />
                </div>
              </div>
            </div>
            <div className="shadow-md sm:rounded-lg p-5 mb-4">
              <h2 className="font-semibold text-primary-700 bg-gray-50 -mt-5 -mx-5 p-4 mb-5">
                <Translate>Change Password</Translate>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                <div className="sm:col-span-1">
                  <InputField
                    id="new-password"
                    label={<Translate>New Password</Translate>}
                    {...register('password')}
                  />
                </div>
                <div className="sm:col-span-1">
                  <InputField
                    id="confirm-new-password"
                    label={<Translate>Confirm New Passowrd</Translate>}
                    {...register('passwordConfirm', { validate: val => val === watch('password') })}
                  />
                </div>

                {errors.passwordConfirm && (
                  <div className="text-sm text-red-800 font-semibold">Passwords do not match.</div>
                )}
              </div>
            </div>
            <div className="shadow-md sm:rounded-lg p-5 mb-4">
              <h2 className="text-m font-semibold text-yellow-800 bg-yellow-100 -mt-5 -mx-5 p-4 mb-5">
                <Translate>Two-Factor Authenticator</Translate>
              </h2>
              <div className="flex gap-6 items-center">
                <Button
                  buttonStyle="secondary"
                  className="flex-none"
                  onClick={() => setIsSidepanelOpen(true)}
                >
                  <Translate>Enable</Translate>
                </Button>
                <div className="flex-1 grow">
                  <Translate>
                    You should activate this feature for enhanced account security.
                  </Translate>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="fixed bottom-0 left-0 w-full p-1 bg-white border-t border-gray-200 lg:sticky z-1">
          <div className="flex gap-2 p-2 pt-1">
            <Button buttonStyle="danger">
              <Translate>Logout</Translate>
            </Button>
            <Button type="submit" form="account-form" buttonStyle="primary">
              <Translate>Update</Translate>
            </Button>
          </div>
        </div>
      </div>
      <Sidepanel
        title={<Translate className="uppercase">Two-step verification</Translate>}
        isOpen={isSidepanelOpen}
        closeSidepanelFunction={() => setIsSidepanelOpen(false)}
      >
        <h1>Sidepanel</h1>
      </Sidepanel>
    </div>
  );
};

export { Account, accountLoader };
