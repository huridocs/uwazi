export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: Error) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  shouldRetry: (error: Error) => {
    const err = error as any;
    return (
      err.code === 'ECONNREFUSED' ||
      err.code === 'ETIMEDOUT' ||
      err.code === 'ECONNRESET' ||
      (err.status && err.status >= 500)
    );
  },
};

const delayPromise = async (ms: number) => {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });
};

const wrapError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'object' && error !== null) {
    return error as Error;
  }
  return new Error(String(error));
};

const retryWithBackoffHelper = async <T>(
  operation: () => Promise<T>,
  config: Required<RetryOptions>,
  attempt: number,
  delay: number
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    const wrappedError = wrapError(error);
    if (!config.shouldRetry(wrappedError)) {
      throw wrappedError;
    }
    if (attempt < config.maxRetries - 1) {
      await delayPromise(delay);
      return retryWithBackoffHelper(
        operation,
        config,
        attempt + 1,
        Math.min(delay * 2, config.maxDelay)
      );
    }
    throw wrappedError;
  }
};

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };

  return retryWithBackoffHelper(operation, config, 0, config.initialDelay);
}

export const descriptiveError = (error: { code: string; message: any; status: number }) => {
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    throw new Error(`Failed to connect to external service: ${error.message}`);
  }
  if (error.status === 404) {
    throw new Error('Results data not found');
  }
  if (error.status === 413) {
    throw new Error('File size exceeds maximum allowed limit');
  }
  if (error.status === 400) {
    throw new Error('Invalid request');
  }
  if (error.status >= 500) {
    throw new Error('External service is currently unavailable');
  }
  throw new Error(`Failed to fetch results: ${error.message}`);
};
