/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { Translate } from 'app/I18N';
import { RequestParams } from 'app/utils/RequestParams';
import UsersAPI from 'app/Users/UsersAPI';
import Auth2faAPI from 'app/Auth2fa/Auth2faAPI';
import { NavigationHeader } from 'V2/Components/UI/NavigationHeader';
import { ActionFunction, LoaderFunction, useLoaderData } from 'react-router-dom';
import { UserSchema } from 'shared/types/userType';
import { InputField } from 'app/V2/Components/Forms';
import { Button, Card, Sidepanel } from 'app/V2/Components/UI';
import { useForm } from 'react-hook-form';
import { TwoFactorSetup } from './Components/TwoFactorSetup';

const accountLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    UsersAPI.currentUser(new RequestParams({}, headers));

const accountAction =
  (): ActionFunction =>
  async ({ request }) => {
    const formData = await request.formData();
    const formIntent = formData.get('intent') as 'update' | '2fa';

    switch (formIntent) {
      case '2fa':
        return Auth2faAPI.enable(new RequestParams({ token: formData.get('token') }));
      default:
        return UsersAPI.save(formData);
    }
  };

const Account = () => {
  const userAccount = useLoaderData() as UserSchema;
  const [isSidepanelOpen, setIsSidepanelOpen] = useState(false);

  type AccountForm = UserSchema & { passwordConfirm?: string };
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountForm>({
    defaultValues: userAccount,
    mode: 'onSubmit',
  });

  const submit = async (data: AccountForm) => {
    console.log(data);
  };
  console.log(userAccount);
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
            <Card className="mb-4" title={<Translate>General Information</Translate>}>
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
            </Card>
            <Card className="mb-4" title={<Translate>Change Password</Translate>}>
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
            </Card>
            {userAccount.using2fa ? (
              <Card
                className="mb-4"
                title={<Translate>Two-Factor Authentication</Translate>}
                color="default"
              >
                <div className="flex gap-6 items-center">
                  <Button buttonStyle="secondary" className="flex-none">
                    <Translate>Activated</Translate>
                  </Button>
                  <div className="flex-1 grow">
                    <Translate>
                      Your account's security is enhanced with two-factor authentication.
                    </Translate>
                  </div>
                </div>
              </Card>
            ) : (
              <Card
                className="mb-4"
                title={<Translate>Two-Factor Authentication</Translate>}
                color="yellow"
              >
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
              </Card>
            )}
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
        title={<Translate className="uppercase">Two-Factor Authentication</Translate>}
        isOpen={isSidepanelOpen}
        closeSidepanelFunction={() => setIsSidepanelOpen(false)}
        size="large"
        withOverlay
      >
        <TwoFactorSetup onCancel={() => setIsSidepanelOpen(false)} />
      </Sidepanel>
    </div>
  );
};

export { Account, accountLoader, accountAction };
