/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'jotai';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { useServiceMutation } from '../useServiceMutation.js';

const mockNotify = jest.fn();

jest.mock('#V2/atoms/requestStatusAtom.js', () => ({
  useRequestStatus: () => ({ notify: mockNotify }),
}));

describe('useServiceMutation', () => {
  beforeEach(() => {
    mockNotify.mockClear();
  });

  it('notifies on success and calls onSuccess', async () => {
    const mutationFn = jest.fn().mockResolvedValue(['saved', undefined]);
    const onSuccess = jest.fn();

    const { result } = renderHook(
      () =>
        useServiceMutation(mutationFn, {
          successMessage: 'Saved',
          onSuccess,
        }),
      { wrapper: Provider }
    );

    await act(async () => {
      await result.current.mutate('input');
    });

    expect(mutationFn).toHaveBeenCalledWith('input');
    expect(mockNotify).toHaveBeenCalledWith('success', 'Saved');
    expect(onSuccess).toHaveBeenCalledWith('saved');
    expect(result.current.isPending).toBe(false);
  });

  it('notifies on error and calls onError', async () => {
    const error = new FetchResponseError('Failed', { status: 500, json: { prettyMessage: 'Oops' } });
    const mutationFn = jest.fn().mockResolvedValue([undefined, error]);
    const onError = jest.fn();

    const { result } = renderHook(() => useServiceMutation(mutationFn, { onError }), {
      wrapper: Provider,
    });

    await act(async () => {
      await result.current.mutate();
    });

    expect(mockNotify).toHaveBeenCalledWith(
      'error',
      'An error occurred',
      undefined,
      'Oops'
    );
    expect(onError).toHaveBeenCalledWith(error);
    expect(result.current.error).toBe(error);
  });
});
