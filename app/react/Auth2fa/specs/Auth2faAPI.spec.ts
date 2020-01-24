/** @format */

import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';

import Auth2faAPI, { Secret, Success } from '../Auth2faAPI';

function hasKey<O>(obj: O, key: keyof any): key is keyof O {
  return key in obj;
}

describe('Auth2faAPI', () => {
  let request: RequestParams;

  beforeEach(() => {
    request = new RequestParams();
    spyOn(api, 'post').and.callFake(async path => {
      const json: Secret | Success =
        path === 'auth2fa-secret' ? { otpauth: 'url', secret: 'secret' } : { success: true };
      return Promise.resolve({ json });
    });
  });

  const testApiResponse = async (method: string, apiUrl: string, expectedResponse: {}) => {
    if (hasKey(Auth2faAPI, method)) {
      const response = await Auth2faAPI[method](request);
      expect(api.post).toHaveBeenCalledWith(`auth2fa-${apiUrl}`, request);
      expect(response).toEqual(expectedResponse);
    } else {
      fail('No such method');
    }
  };

  describe('setSecret', () => {
    it('should post to auth2fa-secret and return response json', async () => {
      await testApiResponse('setSecret', 'secret', { otpauth: 'url', secret: 'secret' });
    });
  });

  describe('enable', () => {
    it('should post to auth2fa-enable and return response json', async () => {
      await testApiResponse('enable', 'enable', { success: true });
    });
  });

  describe('reset2fa', () => {
    it('should post to auth2fa-reset and return response json', async () => {
      await testApiResponse('reset2fa', 'reset', { success: true });
    });
  });
});
