/* eslint-disable max-statements */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useRef, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData, useRevalidator } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useSetAtom } from 'jotai';
import { ClientUserSchema } from 'app/apiResponseTypes';
import { FetchResponseError } from 'shared/JSONRequest';
import { validEmailFormat } from 'V2/shared/formatHelpers';
import { Translate } from 'app/I18N';
import { updateUser, getCurrentUser } from 'V2/api/users';
import { notificationAtom } from 'V2/atoms';
import { InputField } from 'V2/Components/Forms';
import { Button, Card, ConfirmationModal } from 'V2/Components/UI';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { TwoFactorSetup } from './Components/TwoFactorSetup';

const accountLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    getCurrentUser(headers);

const Account = () => {
  const userAccount = useLoaderData() as ClientUserSchema;
  const [isSidepanelOpen, setIsSidepanelOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState(false);
  const passwordConfirmation = useRef<string>();
  const formSubmit = useRef<HTMLButtonElement>(null);
  const setNotifications = useSetAtom(notificationAtom);
  const revalidator = useRevalidator();

  type AccountForm = ClientUserSchema & { passwordConfirm?: string };

  const {
    register,
    watch,
    handleSubmit,
    trigger,
    resetField,
    formState: { errors, isDirty },
  } = useForm<AccountForm>({
    defaultValues: userAccount,
    mode: 'onSubmit',
  });

  const onSubmit = async (data: AccountForm, currentPassword: string) => {
    const { passwordConfirm, ...userData } = data;
    userData.password = userData.password ? userData.password : userAccount.password;

    const response = await updateUser(userData, currentPassword);

    if (response instanceof FetchResponseError) {
      const message = response.json?.prettyMessage ? response.json.prettyMessage : response.message;
      setNotifications({
        type: 'error',
        text: <Translate>An error occurred</Translate>,
        details: message || undefined,
      });
    } else {
      setNotifications({
        type: 'success',
        text: <Translate>Account updated</Translate>,
      });
      revalidator.revalidate();
    }

    resetField('password');
    resetField('passwordConfirm');
  };

  return (
    <div
      className="tw-content"
      style={{ width: '100%', overflowY: 'auto' }}
      data-testid="settings-account"
    >
      <SettingsContent>
        <SettingsContent.Header title="Account" />
        <SettingsContent.Body>
          <form
            id="account-form"
            onSubmit={handleSubmit(async data =>
              onSubmit(data, passwordConfirmation.current || '')
            )}
          >
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
                    {...register('email', {
                      required: true,
                      validate: {
                        format: email => validEmailFormat(email),
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-error-600">
                      <Translate>A valid email is required</Translate>
                    </p>
                  )}
                </div>
              </div>
            </Card>
            <Card className="mb-4" title={<Translate>Change Password</Translate>}>
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                <div className="sm:col-span-1">
                  <InputField
                    id="new-password"
                    hasErrors={!!errors.passwordConfirm}
                    label={<Translate>New password</Translate>}
                    {...register('password')}
                    type="password"
                  />
                  {errors.passwordConfirm && (
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

            <button type="submit" hidden aria-hidden="true" disabled ref={formSubmit} />
          </form>
        </SettingsContent.Body>
        <SettingsContent.Footer>
          <div className="flex gap-2">
            <a
              href="/logout"
              data-testid="account-logout"
              className="px-3 py-2 text-xs font-medium bg-white rounded-lg border hover:text-white text-error-600 border-error-600 hover:bg-error-800 hover:border-error-800 focus:outline-none focus:ring-4 focus:ring-indigo-200"
            >
              <Translate>Logout</Translate>
            </a>

            <Button
              type="button"
              onClick={async () => {
                const validation = await trigger();
                if (validation) {
                  setConfirmationModal(true);
                }
              }}
              disabled={!isDirty}
            >
              <Translate>Update</Translate>
            </Button>
          </div>
        </SettingsContent.Footer>
      </SettingsContent>

      {userAccount.using2fa ? null : (
        <TwoFactorSetup isOpen={isSidepanelOpen} closePanel={() => setIsSidepanelOpen(false)} />
      )}

      {confirmationModal && (
        <ConfirmationModal
          header="Confirm"
          body="Confirm action"
          usePassword
          onCancelClick={() => setConfirmationModal(false)}
          onAcceptClick={value => {
            if (formSubmit.current) {
              passwordConfirmation.current = value;
              formSubmit.current.disabled = false;
              formSubmit.current.click();
              formSubmit.current.disabled = true;
              setConfirmationModal(false);
            }
          }}
        />
      )}
    </div>
  );
};

export { Account, accountLoader };
