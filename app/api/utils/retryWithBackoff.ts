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

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (!config.shouldRetry(lastError)) {
        throw lastError;
      }

      if (attempt < config.maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, config.maxDelay);
        continue;
      }
    }
  }

  throw lastError!;
}

export const descriptiveError = (error: { code: string; message: any; status: number; })=> {
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
}
