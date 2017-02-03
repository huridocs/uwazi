import configureMockStore from 'redux-mock-store';
import backend from 'fetch-mock';
import {APIURL} from 'app/config.js';
import {mockID} from 'shared/uniqueID';
import thunk from 'redux-thunk';
const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);
import {actions as formActions} from 'react-redux-form';

import * as actions from 'app/Thesauris/actions/thesauriActions';
import * as types from 'app/Thesauris/actions/actionTypes';
import * as notificationsTypes from 'app/Notifications/actions/actionTypes';

describe('thesaurisActions', () => {
  let dispatch;
  let getState;

  beforeEach(() => {
    mockID();
    dispatch = jasmine.createSpy('dispatch');
    getState = jasmine.createSpy('getState').and.returnValue({thesauri: {data: {values: [{label: 'something'}]}}});
    backend.restore();
    backend
    .mock(APIURL + 'thesauris', 'post', {body: JSON.stringify({testBackendResult: 'ok'})});
  });

  describe('saveThesauri', () => {
    it('should save the thesauri and dispatch a thesauriSaved action and a notify', (done) => {
      let thesauri = {name: 'Secret list of things', values: []};
      const expectedActions = [
        {type: types.THESAURI_SAVED},
        {type: notificationsTypes.NOTIFY, notification: {message: 'Thesauri saved', type: 'success', id: 'unique_id'}},
        {type: 'rrf/change', model: 'thesauri.data', value: {testBackendResult: 'ok'}, silent: false, multi: false}
      ];
      const store = mockStore({});

      store.dispatch(actions.saveThesauri(thesauri))
      .then(() => {
        expect(store.getActions()).toEqual(expectedActions);
      })
      .then(done)
      .catch(done.fail);

      expect(JSON.parse(backend.lastOptions(APIURL + 'thesauris').body)).toEqual(thesauri);
    });
  });

  describe('addValue()', () => {
    it('should add an empty value to the thesauri', () => {
      spyOn(formActions, 'change');
      actions.addValue()(dispatch, getState);
      expect(formActions.change).toHaveBeenCalledWith('thesauri.data.values', [{label: 'something'}, {label: ''}]);
    });
  });

  describe('removeValue()', () => {
    it('should add an empty value to the thesauri', () => {
      spyOn(formActions, 'change');
      actions.removeValue(0)(dispatch, getState);
      expect(formActions.change).toHaveBeenCalledWith('thesauri.data.values', []);
    });
  });
});
