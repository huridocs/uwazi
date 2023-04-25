import React, { useState } from 'react';
import { useSetRecoilState } from 'recoil';
import { Translate } from 'app/I18N';
import { notificationAtom } from 'V2/atoms';
import { RequestParams } from 'app/utils/RequestParams';

const useApiCaller = () => {
  const [data, setdata] = useState<any>();
  const [error, seterror] = useState('');
  const setNotifications = useSetRecoilState(notificationAtom);

  const requestAction = async (
    action: (params: RequestParams) => Promise<Response>,
    requestParams: RequestParams,
    successAction: string
  ) => {
    try {
      const res = await action(requestParams);
      if (!res.status || res.status === 200) {
        setdata(res.json ? res.json() : res);
      }
      setNotifications({
        type: 'success',
        text: <Translate>{successAction}</Translate>,
      });
    } catch (e) {
      seterror(e.message);
      setNotifications({
        type: 'error',
        text: <Translate>An error occurred</Translate>,
        details: <span>{e.message}</span>,
      });
    }
  };

  return { data, error, requestAction };
};

export { useApiCaller };
