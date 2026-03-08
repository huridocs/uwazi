import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import { RequestParams } from '#app/utils/RequestParams.js';
import { t } from '#app/I18N/index.js';

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
  const { notify } = useRequestStatus();

  const handleSuccess = async (res: Response, successMessage: string) => {
    notify('success', successMessage);
    return getData(res);
  };

  const handleError = async (e: unknown) => {
    const details =
      e instanceof Error ? (e as any).json?.prettyMessage || undefined : undefined;
    notify('error', t('System', 'An error occurred', null, false), undefined, details);
    return e instanceof Error ? e.message : String(e);
  };

  const requestAction = async (
    action: (params: RequestParams) => Promise<Response>,
    requestParams: RequestParams,
    successMessage: string
  ): Promise<ApiCallerResult> => {
    let data;
    let error;
    try {
      const res: Response = await action(requestParams);
      if (!res.status || res.status === 200) {
        data = handleSuccess(res, successMessage);
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
