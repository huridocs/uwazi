/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { IncomingHttpHeaders } from 'http';
import { Translate } from 'app/I18N';
import { RequestParams } from 'app/utils/RequestParams';
import UsersAPI from 'app/Users/UsersAPI';
import { NavigationHeader } from 'V2/Components/UI/NavigationHeader';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import { UserSchema } from 'shared/types/userType';

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
          <h2 className="text-lg text-primary-700 bg-gray-50">
            <Translate>General Information</Translate>
          </h2>
        </div>
      </div>
    </div>
  );
};

export { Account, accountLoader };
