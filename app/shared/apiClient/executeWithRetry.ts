import type { ApiClientEventBus, RequestPolicies } from './ApiClientEventBus.js';
import { cancelledError, isAbortError, timeoutError, toApiError } from './normalizeError.js';
import { computeRetryDelayMs, shouldRetry, sleep, type RetryPolicy } from './retryPolicy.js';
import type { HttpMethod } from './types.js';

type ApiEndpoint = { method: string; url: string };

type AttemptSignal = {
  signal: AbortSignal;
  toApiErrorIfAborted: (error: unknown) => ReturnType<typeof timeoutError> | undefined;
  cleanup: () => void;
};

type ExecuteWithRetryOptions<T> = {
  fn: (signal: AbortSignal | undefined) => Promise<T>;
  method: HttpMethod;
  path: string;
  url: string;
  policy: RetryPolicy;
  signal?: AbortSignal;
  eventBus?: ApiClientEventBus;
  requestId?: string;
  policies?: RequestPolicies;
};

const createRequestId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

const attachUserAbort = (userSignal: AbortSignal, onAbort: () => void) => {
  if (userSignal.aborted) {
    onAbort();
    return;
  }
  userSignal.addEventListener('abort', onAbort, { once: true });
};

const createTimeoutSignal = (
  userSignal: AbortSignal | undefined,
  timeoutMs: number,
  endpoint?: ApiEndpoint
): AttemptSignal => {
  const controller = new AbortController();
  let abortKind: 'timeout' | 'user' | undefined;

  const timeoutId = setTimeout(() => {
    abortKind = 'timeout';
    controller.abort();
  }, timeoutMs);

  if (typeof timeoutId === 'object' && 'unref' in timeoutId) {
    (timeoutId as NodeJS.Timeout).unref();
  }

  const onUserAbort = () => {
    abortKind = 'user';
    controller.abort();
  };

  if (userSignal) attachUserAbort(userSignal, onUserAbort);

  const cleanup = () => {
    clearTimeout(timeoutId);
    userSignal?.removeEventListener('abort', onUserAbort);
  };

  return {
    signal: controller.signal,
    toApiErrorIfAborted: error => {
      cleanup();
      if (abortKind === 'timeout') return timeoutError(endpoint);
      if (abortKind === 'user' || isAbortError(error)) return cancelledError(endpoint);
      return undefined;
    },
    cleanup,
  };
};

const createAttemptSignal = (
  userSignal: AbortSignal | undefined,
  timeoutMs: number,
  endpoint?: ApiEndpoint
): AttemptSignal | undefined => {
  if (!userSignal && !timeoutMs) return undefined;

  if (userSignal && !timeoutMs) {
    return {
      signal: userSignal,
      toApiErrorIfAborted: error =>
        isAbortError(error) || userSignal.aborted ? cancelledError(endpoint) : undefined,
      cleanup: () => undefined,
    };
  }

  return createTimeoutSignal(userSignal, timeoutMs, endpoint);
};

const withAttempt = async <T>(
  attempt: AttemptSignal | undefined,
  run: (signal: AbortSignal | undefined) => Promise<T>
): Promise<T> => {
  try {
    return await run(attempt?.signal).catch(error => {
      const abortError = attempt?.toApiErrorIfAborted(error);
      if (abortError) throw abortError;
      throw error;
    });
  } finally {
    attempt?.cleanup();
  }
};

const handleAttemptFailure = async (options: {
  error: unknown;
  endpoint: ApiEndpoint;
  method: HttpMethod;
  attempt: number;
  policy: RetryPolicy;
  startedAt: number;
  eventBus?: ApiClientEventBus;
  requestId: string;
  policies?: RequestPolicies;
}) => {
  const { error, endpoint, method, attempt, policy, startedAt, eventBus, requestId, policies } =
    options;
  const apiError = toApiError(error, endpoint);

  if (!shouldRetry(apiError, method, attempt, policy, startedAt)) {
    eventBus?.emit({ type: 'request:error', id: requestId, error: apiError, policies });
    throw apiError;
  }

  const delayMs = computeRetryDelayMs(attempt, policy, apiError.retryAfterMs);
  eventBus?.emit({ type: 'retry:scheduled', id: requestId, attempt: attempt + 1, delayMs });
  await sleep(delayMs);
};

const executeWithRetry = async <T>({
  fn,
  method,
  path,
  url,
  policy,
  signal: userSignal,
  eventBus,
  requestId = createRequestId(),
  policies,
}: ExecuteWithRetryOptions<T>): Promise<T> => {
  const startedAt = Date.now();
  const endpoint = { method, url };
  eventBus?.emit({ type: 'request:start', id: requestId, method, path });

  const runAttempt = async (attempt: number): Promise<T> => {
    try {
      const result = await withAttempt(
        createAttemptSignal(userSignal, policy.perAttemptTimeoutMs, endpoint),
        fn
      );
      eventBus?.emit({
        type: 'request:success',
        id: requestId,
        durationMs: Date.now() - startedAt,
      });
      return result;
    } catch (error) {
      await handleAttemptFailure({
        error,
        endpoint,
        method,
        attempt,
        policy,
        startedAt,
        eventBus,
        requestId,
        policies,
      });
      return runAttempt(attempt + 1);
    }
  };

  return runAttempt(0);
};

export { createRequestId, executeWithRetry };
