/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { IncomingHttpHeaders } from 'http';
import { Translate } from 'app/I18N';
import { RequestParams } from 'app/utils/RequestParams';
import UsersAPI from 'app/Users/UsersAPI';
import { NavigationHeader } from 'V2/Components/UI/NavigationHeader';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import { UserSchema } from 'shared/types/userType';
import { InputField } from 'app/V2/Components/Forms';

const accountLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    UsersAPI.currentUser(new RequestParams({}, headers));

const Account = () => {
  const userAccount = useLoaderData() as UserSchema;
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
          <div className="shadow-md sm:rounded-lg p-5 mb-4">
            <h2 className="text-m font-semibold text-primary-700 bg-gray-50 -mt-5 -mx-5 p-4">
              <Translate>General Information</Translate>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 mt-5">
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
                  value={userAccount.email}
                />
              </div>
            </div>
          </div>
          <div className="shadow-md sm:rounded-lg p-5 mb-4">
            <h2 className="text-m font-semibold text-primary-700 bg-gray-50 -mt-5 -mx-5 p-4">
              <Translate>Change Password</Translate>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 mt-5">
              <div className="sm:col-span-1">
                <InputField id="new-password" label={<Translate>New Password</Translate>} />
              </div>
              <div className="sm:col-span-1">
                <InputField
                  id="confirm-new-password"
                  label={<Translate>Confirm New Passowrd</Translate>}
                />
              </div>
            </div>
          </div>
          <div className="shadow-md sm:rounded-lg p-5 mb-4">
            <h2 className="text-m font-semibold text-yellow-800 bg-yellow-100 -mt-5 -mx-5 p-4">
              <Translate>Two-Factor Authenticator</Translate>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 mt-5">
              <div className="sm:col-span-1">
                <InputField id="new-password" label={<Translate>New Password</Translate>} />
              </div>
              <div className="sm:col-span-1">
                <InputField
                  id="confirm-new-password"
                  label={<Translate>Confirm New Passowrd</Translate>}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { Account, accountLoader };
