import { useCallback, useState } from 'react';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import { t } from '#app/I18N/index.js';
import { ApiResponse } from '#V2/api/ApiResponse.js';
import { FetchResponseError } from '#shared/JSONRequest.js';

type ServiceMutationFn<TArgs extends unknown[], TResult> = (
  ...args: TArgs
) => Promise<ApiResponse<TResult, FetchResponseError>>;

type UseServiceMutationOptions<TResult> = {
  successMessage?: string;
  onSuccess?: (result: TResult) => void | Promise<void>;
  onError?: (error: FetchResponseError) => void;
};

const useServiceMutation = <TArgs extends unknown[], TResult>(
  mutationFn: ServiceMutationFn<TArgs, TResult>,
  {
    successMessage,
    onSuccess,
    onError,
  }: UseServiceMutationOptions<TResult> = {}
) => {
  const { notify } = useRequestStatus();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<FetchResponseError | undefined>();

  const mutate = useCallback(
    async (...args: TArgs): Promise<ApiResponse<TResult, FetchResponseError>> => {
      setIsPending(true);
      setError(undefined);
      try {
        const [data, err] = await mutationFn(...args);
        if (err) {
          setError(err);
          const details = err.json?.prettyMessage;
          notify('error', t('System', 'An error occurred', null, false), undefined, details);
          onError?.(err);
          return [undefined as TResult, err];
        }
        if (successMessage) {
          notify('success', successMessage);
        }
        if (data !== undefined) {
          await onSuccess?.(data);
        }
        return [data as TResult, undefined];
      } finally {
        setIsPending(false);
      }
    },
    [mutationFn, notify, successMessage, onSuccess, onError]
  );

  return { mutate, isPending, error };
};

export type { ServiceMutationFn, UseServiceMutationOptions };
export { useServiceMutation };
