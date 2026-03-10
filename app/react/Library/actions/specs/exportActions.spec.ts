/**
 * @format
 * @jest-environment jsdom
 */
import backend from 'fetch-mock';
import superagent from 'superagent';
import Immutable from 'immutable';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { APIURL } from 'app/config.js';
import * as notifications from 'app/Notifications/actions/notificationsActions';
import * as actions from '../exportActions';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);
const mockUpload = superagent.post(`${APIURL}export`);

const mockSuperAgent = (response?: any, err?: any) => {
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  jest.spyOn(mockUpload, 'catch').mockImplementation(cb => {
    if (!cb) throw new Error('mock upload catch cb is not a function');
    if (err) cb(err);
    return mockUpload;
  });
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  jest.spyOn(mockUpload, 'then').mockImplementation(cb => {
    if (!cb) throw new Error('mock upload then cb is not a function');
    cb(response);
    return mockUpload;
  });
  jest.spyOn(mockUpload, 'send').mockReturnValue(mockUpload);
  const requestSet = spyOn(mockUpload, 'set').and.returnValue(mockUpload);
  spyOn(superagent, 'post').and.returnValue(mockUpload);

  return { requestSet };
};

const generateState = () => ({
  ui: Immutable.fromJS({
    selectedDocuments: [],
  }),
  filters: Immutable.fromJS({
    properties: [{ name: 'multiselect', type: 'multiselect' }],
    documentTypes: ['decision'],
  }),
  search: {
    searchTerm: 'batman',
    filters: {
      multiselect: {
        values: ['value'],
      },
    },
    order: 'desc',
    sort: 'creationDate',
  },
});

describe('exportActions', () => {
  let store: any;

  beforeAll(() => {
    window.URL.createObjectURL = (_o: any) => 'http://example_url/';
  });

  beforeEach(() => {
    store = mockStore({
      exportSearchResults: {
        exportSearchResultsProcessing: Immutable.fromJS(false),
        exportSearchResultsContent: Immutable.fromJS('content'),
        exportSearchResultsFileName: Immutable.fromJS('filename'),
      },
    });
  });

  // eslint-disable-next-line max-statements
  describe('exportDocuments', () => {
    const expectedFilters = {
      multiselect: {
        values: ['value'],
      },
    };

    const expectedTypes = ['decision'];

    const state = {
      library: generateState(),
      uploads: generateState(),
      exportSearchResults: {},
    };

    const apiResponse = {
      text: 'csv',
      header: {
        'content-disposition': 'Content-Disposition: attachment; filename="filename.csv"',
      },
    };

    beforeEach(() => {
      backend.restore();
      backend.get('*', {
        body: 'csv',
      });

      store = mockStore(state);
    });

    afterEach(() => backend.restore());

    const testURL = (storeKey: string, done: () => {}) => {
      mockSuperAgent(apiResponse);
      store.dispatch(actions.exportDocuments(storeKey)).then(() => {
        expect(superagent.post).toHaveBeenCalledWith('/api/export');
        expect(mockUpload.send).toHaveBeenCalledWith({
          filters: expectedFilters,
          searchTerm: 'batman',
          order: 'desc',
          sort: 'creationDate',
          types: expectedTypes,
          limit: 10000,
          unpublished: storeKey === 'uploads' ? true : undefined,
        });
        done();
      });
    };

    it('should set the captcha values in the header if there is a captcha', done => {
      const { requestSet } = mockSuperAgent(apiResponse);
      store.dispatch(actions.exportDocuments('library', { text: 'CFcD', id: '1234' })).then(() => {
        expect(requestSet).toHaveBeenCalledWith('Captcha-text', 'CFcD');
        expect(requestSet).toHaveBeenCalledWith('Captcha-id', '1234');
        done();
      });
    });

    it('should set the processing flag in the store', done => {
      mockSuperAgent(apiResponse);
      store.dispatch(actions.exportDocuments('library')).then(() => {
        expect(store.getActions()[0]).toEqual({
          type: 'exportSearchResultsProcessing/SET',
          value: true,
        });
        done();
      });
    });

    it('should process the current filters, order and searchTerm', done => {
      testURL('library', done);
    });

    it('should add unpublished flag if using uploads store', done => {
      testURL('uploads', done);
    });

    it('should append the entityids if the user selected any', done => {
      const selectedState = { ...state };
      selectedState.library.ui = Immutable.fromJS({
        selectedDocuments: [
          Immutable.fromJS({
            sharedId: '1',
          }),
          Immutable.fromJS({
            sharedId: '2',
          }),
        ],
      });
      const selectedStore = mockStore(selectedState);

      mockSuperAgent(apiResponse);
      selectedStore.dispatch<any>(actions.exportDocuments('library')).then(() => {
        expect(superagent.post).toHaveBeenCalledWith('/api/export');
        expect(mockUpload.send).toHaveBeenCalledWith({
          filters: expectedFilters,
          searchTerm: 'batman',
          order: 'desc',
          sort: 'creationDate',
          types: expectedTypes,
          limit: 10000,
          ids: ['1', '2'],
        });
        done();
      });
    });

    it('should set file name and content on the store', done => {
      mockSuperAgent(apiResponse);
      const dispatch = jest.fn();
      const getState = jest.fn(() => state);
      actions
        .exportDocuments('library')(dispatch, getState)
        .then(() => {
          expect(dispatch).toHaveBeenCalledWith({
            type: 'exportSearchResultsContent/SET',
            value: 'csv',
          });
          expect(dispatch).toHaveBeenCalledWith({
            type: 'exportSearchResultsFileName/SET',
            value: 'filename.csv',
          });
          done();
        })
        .catch(e => {
          throw e;
        });
    });

    it('should clean the state and dispatch a notification if the an error occurs', done => {
      const dispatch = jest.fn();
      const getState = jest.fn(() => state);

      mockSuperAgent(apiResponse, new Error('error message'));

      spyOn(notifications, 'notify');

      actions
        .exportDocuments('library')(dispatch, getState)
        .then(() => {
          expect(dispatch).toHaveBeenCalledWith({
            type: 'exportSearchResultsProcessing/SET',
            value: false,
          });
          expect(dispatch).toHaveBeenCalledWith({
            type: 'exportSearchResultsContent/SET',
            value: '',
          });
          expect(dispatch).toHaveBeenCalledWith({
            type: 'exportSearchResultsFileName/SET',
            value: '',
          });
          expect(notifications.notify).toHaveBeenCalled();
          done();
        })
        .catch(e => {
          throw e;
        });
    });

    it('should dispatch a correct notification if the captcha is invalid', done => {
      const dispatch = jest.fn();
      const getState = jest.fn(() => state);

      mockSuperAgent(apiResponse, { status: 403 });

      spyOn(notifications, 'notify');

      actions
        .exportDocuments('library')(dispatch, getState)
        .then(() => {
          expect(notifications.notify).toHaveBeenCalledWith(
            expect.stringContaining('captcha'),
            'danger'
          );
          done();
        })
        .catch(e => {
          throw e;
        });
    });
  });

  describe('endExport', () => {
    let appendedChild: HTMLAnchorElement;
    let removedChild: Node;

    beforeAll(() => {
      const originalAppendChild = document.body.appendChild;
      const originalRemoveChild = document.body.removeChild;
      jest.spyOn(document.body, 'appendChild').mockImplementation(child => {
        appendedChild = originalAppendChild.bind(document.body)(child) as HTMLAnchorElement;
        spyOn(appendedChild, 'click');
        return appendedChild;
      });
      jest.spyOn(document.body, 'removeChild').mockImplementation(child => {
        removedChild = originalRemoveChild.bind(document.body)(child);
        return removedChild;
      });
    });

    it('should create, click and erase an anchor element', () => {
      store.dispatch(actions.exportEnd());
      expect(appendedChild.href).toBe('http://example_url/');
      expect(appendedChild.download).toBe('filename');
      expect(appendedChild.click).toHaveBeenCalled();
      expect(appendedChild).toBe(removedChild);
    });

    it('should clean the store', () => {
      store.dispatch(actions.exportEnd());
      expect(store.getActions()).toEqual([
        {
          type: 'exportSearchResultsProcessing/SET',
          value: false,
        },
        {
          type: 'exportSearchResultsContent/SET',
          value: '',
        },
        {
          type: 'exportSearchResultsFileName/SET',
          value: '',
        },
      ]);
    });
  });
});
