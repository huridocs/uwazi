/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'jotai';
// @ts-expect-error TS(2307): Cannot find module '../../utils/RequestParams.js' ... Remove this comment to see the full error message
import { RequestParams } from '../../utils/RequestParams.js';
// @ts-expect-error TS(2307): Cannot find module '../../I18N.js' or its correspo... Remove this comment to see the full error message
import { Translate } from '../../I18N.js';
import React from 'react';
import { useApiCaller } from '../useApiCaller';

const mockSetNotification = jest.fn();

jest.mock('jotai', () => ({
  ...jest.requireActual('jotai'),
  useSetAtom: () => mockSetNotification,
}));

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
        <Translate>successful action</Translate>
      );

      expect(mockSetNotification).toHaveBeenCalled();

      if (success) {
        expect(await apiResult.data).toEqual({ data: 'result' });
        expect(await apiResult.error).toBeUndefined();
        expect(mockSetNotification.mock.calls[0][0].type).toEqual('success');
        expect(mockSetNotification.mock.calls[0][0].text.props.children).toEqual(
          'successful action'
        );
      } else {
        expect(await apiResult.data).toBeUndefined();
        expect(await apiResult.error).toEqual('An error occurred');
        expect(mockSetNotification.mock.calls[0][0].type).toEqual('error');
        expect(mockSetNotification.mock.calls[0][0].text.props.children).toEqual(
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
