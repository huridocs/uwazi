import React, { useEffect } from 'react';
import { useFetchers } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { last } from 'lodash';
import { Translate } from 'app/I18N';
import { FetchResponseError } from 'shared/JSONRequest';
import { notificationAtom } from 'app/V2/atoms';

const useHandleNotifications = () => {
  const fetchers = useFetchers();
  const setNotifications = useSetRecoilState(notificationAtom);

  useEffect(() => {
    if (!fetchers.length) return;

    const lastFetcherCall = last(fetchers) || fetchers[0];
    const intent = lastFetcherCall.formData?.get('intent');
    const { data } = lastFetcherCall;

    if (data instanceof FetchResponseError) {
      setNotifications({
        type: 'error',
        text: <Translate>An error occurred</Translate>,
        details: data.json?.prettyMessage ? data.json?.prettyMessage : undefined,
      });

      return;
    }

    switch (intent) {
      case 'new-user':
        setNotifications({
          type: 'success',
          text: <Translate>User saved</Translate>,
        });
        break;

      case 'edit-user':
        setNotifications({
          type: 'success',
          text: <Translate>User updated</Translate>,
        });
        break;

      case 'new-group':
        setNotifications({
          type: 'success',
          text: <Translate>Group saved</Translate>,
        });
        break;

      case 'edit-group':
        setNotifications({
          type: 'success',
          text: <Translate>Group updated</Translate>,
        });
        break;

      case 'delete-users':
        setNotifications({
          type: 'success',
          text: <Translate>Users deleted</Translate>,
        });
        break;

      case 'delete-groups':
        setNotifications({
          type: 'success',
          text: <Translate>Groups deleted</Translate>,
        });
        break;

      default:
        break;
    }
  }, [fetchers, setNotifications]);
};

export { useHandleNotifications };
