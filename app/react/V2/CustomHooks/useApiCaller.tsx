import React from 'react';
import { useSetAtom } from 'jotai';
import { Translate } from 'app/I18N';
import { notificationAtom } from 'V2/atoms';
import { RequestParams } from 'app/utils/RequestParams';
import { FetchResponseError } from 'shared/JSONRequest';

interface ApiCallerResult {
  data?: Promise<any | undefined>;
  error?: Promise<string | undefined>;
}
const getData = async (res: Response) => (res.json ? res.json() : res);
const getError = async (res: Response) => {
  const json = res.json ? await res.json() : undefined;
  return json && json.error ? json.error : new Error('An error occurred');
};

const useApiCaller = () => {
  const setNotifications = useSetAtom(notificationAtom);

  const handleSuccess = async (res: Response, successMessageComponent: React.ReactNode) => {
    setNotifications({
      type: 'success',
      text: successMessageComponent,
    });
    return getData(res);
  };

  const handleError = async (e: FetchResponseError) => {
    setNotifications({
      type: 'error',
      text: <Translate>An error occurred</Translate>,
      details: e.json?.prettyMessage ? <span>{e.json.prettyMessage}</span> : undefined,
    });
    return e.message;
  };

  const requestAction = async (
    action: (params: RequestParams) => Promise<Response>,
    requestParams: RequestParams,
    successMessageComponent: React.ReactNode
  ): Promise<ApiCallerResult> => {
    let data;
    let error;
    try {
      const res: Response = await action(requestParams);
      if (!res.status || res.status === 200) {
        data = handleSuccess(res, successMessageComponent);
      } else {
        error = handleError(await getError(res));
      }
    } catch (e) {
      error = handleError(e);
    }
    const result1: ApiCallerResult = { data, error: Promise.resolve(error) };
    return result1;
  };

  return { requestAction };
};

export type { ApiCallerResult };
export { useApiCaller };
