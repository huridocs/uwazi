import { useEffect } from 'react';
import { useFetchers } from 'react-router';
import last from 'lodash/last.js';

import { t } from '#app/I18N/index.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import { FormIntent } from './types.js';

const useHandleNotifications = () => {
  const fetchers = useFetchers();
  const { notify } = useRequestStatus();

  const lastFetcherCall = last(fetchers) || fetchers[0];
  const intent = lastFetcherCall?.formData?.get('intent') as FormIntent;
  const { data } = lastFetcherCall || {};

  useEffect(() => {
    if (!intent || !data) return;

    if (data instanceof FetchResponseError) {
      const message = data.json?.prettyMessage ? data.json.prettyMessage : data.message;
      notify('error', t('System', 'An error occurred', null, false), undefined, message || undefined);
      return;
    }

    let title: string | undefined;

    switch (intent) {
      case 'new-user':
        title = t('System', 'Added new user', null, false);
        break;

      case 'edit-user':
        title = t('System', 'User updated', null, false);
        break;

      case 'new-group':
        title = t('System', 'Group saved', null, false);
        break;

      case 'edit-group':
        title = t('System', 'Group updated', null, false);
        break;

      case 'delete-users':
        title = t('System', 'Deleted user', null, false);
        break;

      case 'delete-groups':
        title = t('System', 'Deleted user group', null, false);
        break;

      case 'unlock-user':
        title = t('System', 'Account unlocked successfully', null, false);
        break;

      case 'reset-password':
      case 'bulk-reset-password':
        title = t(
          'System',
          'Instructions to reset the password were sent to the user',
          null,
          false
        );
        break;

      case 'reset-2fa':
      case 'bulk-reset-2fa':
        title = t('System', 'Disabled 2FA', null, false);
        break;

      default:
        break;
    }

    if (title) {
      notify('success', title);
    }
  }, [data, intent, notify]);
};

export { useHandleNotifications };
