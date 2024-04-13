/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import * as jotai from 'jotai/react';
import { RequestParams } from 'app/utils/RequestParams';
import { Translate } from 'app/I18N';
import React from 'react';
import { useApiCaller } from '../useApiCaller';

describe('describe useApiCaller', () => {
  let apiCallerHook: {
    current: {
      requestAction: (
        arg0: jest.Mock<any, any>,
        arg1: RequestParams<{ data: string }>,
        arg2: React.ReactNode
      ) => any;
    };
  };

  const setNotificationMock = jest.fn();

  beforeEach(() => {
    jest.spyOn(jotai, 'useSetAtom').mockImplementation((_state: any) => setNotificationMock);

    ({ result: apiCallerHook } = renderHook(() => useApiCaller(), { wrapper: jotai.Provider }));
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
        <Translate>successful action</Translate>
      );
      expect(setNotificationMock).toHaveBeenCalled();

      if (success) {
        expect(await apiResult.data).toEqual({ data: 'result' });
        expect(await apiResult.error).toBeUndefined();
        expect(setNotificationMock.mock.calls[0][0].type).toEqual('success');
        expect(setNotificationMock.mock.calls[0][0].text.props.children).toEqual(
          'successful action'
        );
      } else {
        expect(await apiResult.data).toBeUndefined();
        expect(await apiResult.error).toEqual('An error occurred');
        expect(setNotificationMock.mock.calls[0][0].type).toEqual('error');
        expect(setNotificationMock.mock.calls[0][0].text.props.children).toEqual(
          'An error occurred'
        );
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
