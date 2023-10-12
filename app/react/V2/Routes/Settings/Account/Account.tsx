/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { RequestParams } from 'app/utils/RequestParams';
import UsersAPI from 'app/Users/UsersAPI';
import { UserSchema } from 'shared/types/userType';

import { LoaderFunction, useLoaderData, useRevalidator } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useSetRecoilState } from 'recoil';
import { notificationAtom } from 'app/V2/atoms';

import { InputField } from 'app/V2/Components/Forms';
import { Button, Card, Sidepanel } from 'app/V2/Components/UI';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Translate } from 'app/I18N';
import { TwoFactorSetup } from './Components/TwoFactorSetup';

const accountLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    UsersAPI.currentUser(new RequestParams({}, headers));

const Account = () => {
  const userAccount = useLoaderData() as UserSchema;
  const [isSidepanelOpen, setIsSidepanelOpen] = useState(false);
  const setNotifications = useSetRecoilState(notificationAtom);
  const revalidator = useRevalidator();

  type AccountForm = UserSchema & { passwordConfirm?: string };
  const {
    register,
    watch,
    handleSubmit,
    reset,
    formState: { errors, isSubmitted },
  } = useForm<AccountForm>({
    defaultValues: userAccount,
    mode: 'onSubmit',
  });

  const submit = async (data: AccountForm) => {
    const { passwordConfirm, ...userData } = data;
    userData.password = userData.password ? userData.password : userAccount.password;
    await UsersAPI.save(new RequestParams(userData));
    await revalidator.revalidate();
    setNotifications({
      type: 'success',
      text: <Translate>Account updated</Translate>,
    });
  };

  useEffect(() => {
    reset({ ...userAccount, password: '', passwordConfirm: '' });
  }, [userAccount, reset]);

  return (
    <div
      className="tw-content"
      style={{ width: '100%', overflowY: 'auto' }}
      data-testid="settings-account"
    >
      <SettingsContent>
        <SettingsContent.Header title="Account" />
        <SettingsContent.Body>
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
                    hasErrors={!!errors.email}
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
                    hasErrors={!!errors.passwordConfirm}
                    label={<Translate>New Password</Translate>}
                    {...register('password')}
                    type="password"
                  />
                  {errors.passwordConfirm && isSubmitted && (
                    <p className="mt-2 text-sm text-error-600">
                      <Translate>Passwords do not match</Translate>
                    </p>
                  )}
                </div>
                <div className="sm:col-span-1">
                  <InputField
                    id="confirm-new-password"
                    hasErrors={!!errors.passwordConfirm}
                    label={<Translate>Confirm new password</Translate>}
                    {...register('passwordConfirm', { validate: val => val === watch('password') })}
                    type="password"
                  />
                </div>
              </div>
            </Card>
            {userAccount.using2fa ? (
              <Card
                className="mb-4"
                title={<Translate>Two-Factor Authentication</Translate>}
                color="default"
              >
                <div className="flex gap-6 items-center">
                  <Button color="success" disabled className="flex-none">
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
                    styling="outline"
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
        </SettingsContent.Body>
        <SettingsContent.Footer>
          <div className="flex gap-2">
            <a
              href="/logout"
              data-testid="account-logout"
              className="px-3 py-2 text-xs font-medium bg-white rounded-lg border hover:text-white text-error-700 border-error-700 hover:bg-error-800 hover:border-error-800 focus:outline-none focus:ring-4 focus:ring-indigo-200"
            >
              <Translate>Logout</Translate>
            </a>

            <Button type="submit" form="account-form">
              <Translate>Update</Translate>
            </Button>
          </div>
        </SettingsContent.Footer>
      </SettingsContent>
      <Sidepanel
        title={<Translate className="uppercase">Two-Factor Authentication</Translate>}
        isOpen={isSidepanelOpen}
        closeSidepanelFunction={() => setIsSidepanelOpen(false)}
        size="large"
        withOverlay
      >
        <TwoFactorSetup closePanel={() => setIsSidepanelOpen(false)} />
      </Sidepanel>
    </div>
  );
};

export { Account, accountLoader };
