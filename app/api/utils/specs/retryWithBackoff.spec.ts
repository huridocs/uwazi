import { retryWithBackoff, RetryOptions } from '../retryWithBackoff';

describe('retryWithBackoff', () => {
  jest.setTimeout(30000);

  it('should succeed on first try', async () => {
    const operation = jest.fn().mockResolvedValue('success');
    const result = await retryWithBackoff(operation);
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable errors and eventually succeed', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce({ code: 'ECONNREFUSED' })
      .mockRejectedValueOnce({ code: 'ETIMEDOUT' })
      .mockResolvedValueOnce('success');

    const result = await retryWithBackoff(operation);
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should not retry on non-retryable errors', async () => {
    const operation = jest.fn().mockRejectedValue({ status: 400 });
    await expect(retryWithBackoff(operation)).rejects.toEqual({ status: 400 });
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should respect custom retry options', async () => {
    const options: RetryOptions = {
      maxRetries: 3,
      initialDelay: 10,
      maxDelay: 20,
      shouldRetry: (error: any) => error.code === 'CUSTOM_ERROR',
    };

    const operation = jest
      .fn()
      .mockRejectedValueOnce({ code: 'CUSTOM_ERROR' })
      .mockRejectedValueOnce({ code: 'CUSTOM_ERROR' })
      .mockResolvedValueOnce('success');

    const result = await retryWithBackoff(operation, options);
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should throw last error after max retries', async () => {
    const error = { code: 'ECONNREFUSED' };
    const operation = jest.fn().mockRejectedValue(error);

    await expect(retryWithBackoff(operation, { maxRetries: 2, initialDelay: 10 })).rejects.toEqual(
      error
    );
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should respect maxDelay option', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce({ code: 'ECONNREFUSED' })
      .mockRejectedValueOnce({ code: 'ECONNREFUSED' })
      .mockRejectedValueOnce({ code: 'ECONNREFUSED' })
      .mockResolvedValueOnce('success');

    const result = await retryWithBackoff(operation, {
      maxRetries: 4,
      maxDelay: 20,
      initialDelay: 10,
    });
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(4);
  });
});
