import React, { useEffect } from 'react';
import { useFetchers } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { last } from 'lodash';
import { Translate } from 'app/I18N';
import { FetchResponseError } from 'shared/JSONRequest';
import { notificationAtom } from 'app/V2/atoms';
import { FormIntent } from './types';

const useHandleNotifications = () => {
  const fetchers = useFetchers();
  const setNotifications = useSetRecoilState(notificationAtom);

  const lastFetcherCall = last(fetchers) || fetchers[0];
  const intent = lastFetcherCall?.formData?.get('intent') as FormIntent;
  const { data } = lastFetcherCall || {};

  useEffect(() => {
    if (!intent || !data) return;

    if (data instanceof FetchResponseError) {
      setNotifications({
        type: 'error',
        text: <Translate>An error occurred</Translate>,
        details: data.json?.prettyMessage ? data.json.prettyMessage : undefined,
      });

      return;
    }

    let text: React.ReactNode;

    switch (intent) {
      case 'new-user':
        text = <Translate>Added new user</Translate>;
        break;

      case 'edit-user':
        text = <Translate>User updated</Translate>;
        break;

      case 'new-group':
        text = <Translate>Group saved</Translate>;
        break;

      case 'edit-group':
        text = <Translate>Group updated</Translate>;
        break;

      case 'delete-users':
        text = <Translate>Deleted user</Translate>;
        break;

      case 'delete-groups':
        text = <Translate>Deleted user group</Translate>;
        break;

      case 'unlock-user':
        text = <Translate>Account unlocked successfully</Translate>;
        break;

      case 'reset-password':
      case 'bulk-reset-password':
        text = <Translate>Instruction to reset password sent to user</Translate>;
        break;

      case 'reset-2fa':
      case 'bulk-reset-2fa':
        text = <Translate>Disabled 2FA</Translate>;
        break;

      default:
        break;
    }

    if (text) {
      setNotifications({
        type: 'success',
        text,
      });
    }
  }, [data, intent, setNotifications]);
};

export { useHandleNotifications };
