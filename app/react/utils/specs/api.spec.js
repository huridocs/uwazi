/**
 * @jest-environment jsdom
 */
/** @format */

import { browserHistory } from 'react-router';
import { RequestParams } from 'app/utils/RequestParams';

import { APIURL } from 'app/config';
import { store } from 'app/store';
import api from 'app/utils/api';
import backend from 'fetch-mock';
import loadingBar from 'app/App/LoadingProgressBar';
import * as notifyActions from 'app/Notifications/actions/notificationsActions';

describe('api', () => {
  beforeEach(() => {
    spyOn(loadingBar, 'start');
    spyOn(loadingBar, 'done');
    spyOn(store, 'dispatch');
    spyOn(notifyActions, 'notify').and.returnValue('notify action');
    spyOn(browserHistory, 'replace');
    backend.restore();
    backend
      .get(`${APIURL}test_get`, JSON.stringify({ method: 'GET' }))
      .get(`${APIURL}test_get?key=value`, JSON.stringify({ method: 'GET' }))
      .post(`${APIURL}test_post`, JSON.stringify({ method: 'POST' }))
      .delete(`${APIURL}test_delete?data=delete`, JSON.stringify({ method: 'DELETE' }))
      .get(`${APIURL}unauthorised`, { status: 401, body: {} })
      .get(`${APIURL}notfound`, { status: 404, body: {} })
      .get(`${APIURL}conflict`, { status: 409, body: { error: 'conflict error' } })
      .get(`${APIURL}error_url`, { status: 500, body: {} })
      .get(`${APIURL}network_error`, {
        throws: new TypeError('Failed to fetch'),
      })
      .get(`${APIURL}unknown_error`, { throws: new Error('some error') });
  });

  afterEach(() => backend.restore());

  describe('GET', () => {
    it('should prefix url with config api url', async () => {
      const response = await api.get('test_get');
      expect(response.json.method).toBe('GET');
    });

    it('should start and end the loading bar', async () => {
      await api.get('test_get');
      expect(loadingBar.done).toHaveBeenCalled();
      expect(loadingBar.start).toHaveBeenCalled();
    });

    it('should add headers and data as query string', async () => {
      const requestParams = new RequestParams(
        { key: 'value' },
        { header: 'value', header2: 'value2' }
      );
      await api.get('test_get', requestParams);

      expect(backend.calls()[0][1].headers.header).toBe('value');
      expect(backend.calls()[0][1].headers.header2).toBe('value2');
    });
  });

  describe('POST', () => {
    it('should prefix url with config api url', async () => {
      const requestParams = new RequestParams(
        { key: 'value' },
        { header: 'value', header2: 'value2' }
      );
      const response = await api.post('test_post', requestParams);

      expect(backend.calls()[0][1].body).toBe(JSON.stringify({ key: 'value' }));
      expect(backend.calls()[0][1].headers.header).toBe('value');
      expect(backend.calls()[0][1].headers.header2).toBe('value2');
      expect(response.json.method).toBe('POST');
    });

    it('should start and end the loading bar', async () => {
      const promise = api.post('test_post', {});
      expect(loadingBar.start).toHaveBeenCalled();

      await promise;
      expect(loadingBar.done).toHaveBeenCalled();
    });
  });

  describe('DELETE', () => {
    it('should prefix url with config api url', async () => {
      const requestParams = new RequestParams(
        { data: 'delete' },
        { header: 'value', header2: 'value2' }
      );
      const response = await api.delete('test_delete', requestParams);

      expect(response.json.method).toBe('DELETE');
      expect(backend.calls()[0][1].headers.header).toBe('value');
      expect(backend.calls()[0][1].headers.header2).toBe('value2');
    });

    it('should start and end the loading bar', async () => {
      const requestParams = new RequestParams(
        { data: 'delete' },
        { header: 'value', header2: 'value2' }
      );
      const promise = api.delete('test_delete', requestParams);
      expect(loadingBar.start).toHaveBeenCalled();

      await promise;
      expect(loadingBar.done).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    async function testErrorHandling(endpoint, errorCallback) {
      try {
        await api.get(endpoint);
        fail('should throw error');
      } catch (e) {
        errorCallback(e);
      }
    }

    function testNotificationDisplayed(message, type = 'danger') {
      expect(store.dispatch).toHaveBeenCalledWith('notify action');
      expect(notifyActions.notify).toHaveBeenCalledWith(message, type);
    }

    describe('401', () => {
      it('should redirect to login', async () => {
        await testErrorHandling('unauthorised', () => {
          expect(browserHistory.replace).toHaveBeenCalledWith('/login');
        });
      });
    });

    describe('404', () => {
      it('should redirect to login', async () => {
        await testErrorHandling('notfound', () => {
          expect(browserHistory.replace).toHaveBeenCalledWith('/404');
        });
      });
    });

    describe('409 (Conflict)', () => {
      it('should notify as a warning, not danger', async () => {
        await testErrorHandling('conflict', () => {
          testNotificationDisplayed('conflict error', 'warning');
        });
      });
    });

    describe('network error', () => {
      it('should notify that server is unreachable', async () => {
        await testErrorHandling('network_error', () => {
          testNotificationDisplayed('Could not reach server. Please try again later.');
        });
      });
    });

    describe('unknown error', () => {
      it('should show generic error message', async () => {
        await testErrorHandling('unknown_error', () => {
          testNotificationDisplayed('An error has occurred');
        });
      });
    });

    it('should notify the user', async () => {
      await testErrorHandling('error_url', () => {
        testNotificationDisplayed('An error has occurred');
      });
    });

    it('should end the loading bar', async () => {
      await testErrorHandling('error_url', () => {
        expect(loadingBar.done).toHaveBeenCalled();
      });
    });
  });
});
