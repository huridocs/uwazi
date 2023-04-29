/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import * as recoil from 'recoil';
import { RecoilRoot, RecoilState } from 'recoil';
import { RequestParams } from 'app/utils/RequestParams';
import { notificationAtomType } from 'app/V2/atoms';
import { useApiCaller } from '../useApiCaller';

describe('describe useApiCaller', () => {
  // eslint-disable-next-line max-statements
  it('should handle a success response', async () => {
    const setNotificationMock = jest.fn();
    jest
      .spyOn(recoil, 'useSetRecoilState')
      .mockImplementation((_state: RecoilState<notificationAtomType>) => setNotificationMock);

    const { result } = renderHook(() => useApiCaller(), { wrapper: RecoilRoot });
    const apiMock = jest
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ data: 'result' }), { status: 200 }));

    let apiResult;
    await act(async () => {
      apiResult = await result.current.requestAction(
        apiMock,
        new RequestParams({ data: 'paramid' }),
        'successful action'
      );

      const data = await apiResult.data;
      const error = await apiResult.error;
      expect(data).toEqual({ data: 'result' });
      expect(error).toBeUndefined();
      expect(setNotificationMock).toHaveBeenCalled();
      expect(setNotificationMock.mock.calls[0][0].type).toEqual('success');
      expect(setNotificationMock.mock.calls[0][0].text.props.children).toEqual('successful action');
    });
  });

  it.todo('should handle a response with error');
  it.todo('should handle an exception');
});
