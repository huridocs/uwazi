/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'jotai';
import { RequestParams } from '#app/utils/RequestParams.js';
import { useApiCaller } from '../useApiCaller.js';

const mockNotify = jest.fn();

jest.mock('#V2/atoms/requestStatusAtom.js', () => ({
  useRequestStatus: () => ({ notify: mockNotify }),
}));

describe('describe useApiCaller', () => {
  let apiCallerHook: {
    current: {
      requestAction: (
        arg0: jest.Mock<any, any>,
        arg1: RequestParams<{ data: string }>,
        arg2: string
      ) => any;
    };
  };

  beforeEach(() => {
    ({ result: apiCallerHook } = renderHook(() => useApiCaller(), { wrapper: Provider }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const checkHookInvokation = async (apiMock: jest.Mock<any, any>, success: boolean = true) => {
    // eslint-disable-next-line max-statements
    await act(async () => {
      const apiResult = await apiCallerHook.current.requestAction(
        apiMock,
        new RequestParams({ data: 'paramid' }),
        'successful action'
      );

      expect(mockNotify).toHaveBeenCalled();

      if (success) {
        expect(await apiResult.data).toEqual({ data: 'result' });
        expect(await apiResult.error).toBeUndefined();
        expect(mockNotify.mock.calls[0][0]).toEqual('success');
        expect(mockNotify.mock.calls[0][1]).toEqual('successful action');
      } else {
        expect(await apiResult.data).toBeUndefined();
        expect(await apiResult.error).toEqual('An error occurred');
        expect(mockNotify.mock.calls[0][0]).toEqual('error');
      }
    });
  };

  it('should handle a success response', async () => {
    const apiMock = jest
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ data: 'result' }), { status: 200 }));

    await checkHookInvokation(apiMock, true);
  });

  it('should handle a response with error', async () => {
    const apiMock = jest.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 500 }));

    await checkHookInvokation(apiMock, false);
  });

  it('should handle an exception', async () => {
    const apiMock = jest.fn().mockRejectedValue(new Error('An error occurred'));

    await checkHookInvokation(apiMock, false);
  });
});
