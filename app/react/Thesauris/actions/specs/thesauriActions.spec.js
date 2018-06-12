import configureMockStore from 'redux-mock-store';
import backend from 'fetch-mock';
import { APIURL } from 'app/config.js';
import { mockID } from 'shared/uniqueID';
import thunk from 'redux-thunk';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);
import { actions as formActions } from 'react-redux-form';

import * as actions from 'app/Thesauris/actions/thesauriActions';
import * as types from 'app/Thesauris/actions/actionTypes';
import * as notificationsTypes from 'app/Notifications/actions/actionTypes';

describe('thesaurisActions', () => {
  let dispatch;
  let getState;

  beforeEach(() => {
    mockID();
    dispatch = jasmine.createSpy('dispatch');
    getState = jasmine.createSpy('getState').and.returnValue({ thesauri: { data: { values: [{ label: 'something' }, { label: '' }] } } });
    backend.restore();
    backend
    .post(`${APIURL}thesauris`, { body: JSON.stringify({ testBackendResult: 'ok' }) });
  });

  afterEach(() => backend.restore());

  describe('saveThesauri', () => {
    it('should save the thesauri and dispatch a thesauriSaved action and a notify', (done) => {
      const thesauri = { name: 'Secret list of things', values: [] };
      const expectedActions = [
        { type: types.THESAURI_SAVED },
        { type: notificationsTypes.NOTIFY, notification: { message: 'Thesaurus saved', type: 'success', id: 'unique_id' } },
        { type: 'rrf/change', model: 'thesauri.data', value: { testBackendResult: 'ok' }, silent: false, multi: false, external: true }
      ];
      const store = mockStore({});

      store.dispatch(actions.saveThesauri(thesauri))
      .then(() => {
        expect(store.getActions()).toEqual(expectedActions);
      })
      .then(done)
      .catch(done.fail);

      expect(JSON.parse(backend.lastOptions(`${APIURL}thesauris`).body)).toEqual(thesauri);
    });
  });

  describe('addValue()', () => {
    it('should add an empty value to the thesauri', () => {
      getState.and.returnValue({ thesauri: { data: { values: [{ label: 'something' }] } } });
      spyOn(formActions, 'change');
      actions.addValue()(dispatch, getState);
      expect(formActions.change).toHaveBeenCalledWith('thesauri.data.values', [{ label: 'something' }, { label: '', id: 'unique_id' }]);
    });
  });

  describe('addGroup()', () => {
    it('should add a new group at the end', () => {
      spyOn(formActions, 'change');
      actions.addGroup()(dispatch, getState);
      expect(formActions.change)
      .toHaveBeenCalledWith('thesauri.data.values', [{ label: 'something' }, { label: '', values: [{ label: '', id: 'unique_id' }] }]);
    });
  });

  describe('removeValue()', () => {
    it('should remove the value from the list', () => {
      getState.and.returnValue({
        thesauri: { data: { values: [
          { label: 'B', id: 1 },
          { label: 'A', id: 2, values: [{ label: 'D', id: 3 }, { label: 'C', id: 4 }, { label: '' }] },
          { label: '' }
        ] } }
      });
      spyOn(formActions, 'change');
      actions.removeValue(0)(dispatch, getState);
      expect(formActions.change).toHaveBeenCalledWith('thesauri.data.values', [
      { label: 'A', id: 2, values: [{ label: 'D', id: 3 }, { label: 'C', id: 4 }, { label: '' }] },
      { label: '' }]);

      actions.removeValue(0, 1)(dispatch, getState);
      expect(formActions.change).toHaveBeenCalledWith('thesauri.data.values', [
      { label: 'B', id: 1 },
      { label: 'A', id: 2, values: [{ label: 'C', id: 4 }, { label: '' }] },
      { label: '' }]);
    });
  });

  describe('sortValues()', () => {
    it('should sort the values', () => {
      getState.and.returnValue({ thesauri: { data: { values: [{ label: 'B' }, { label: 'A', values: [{ label: 'D' }, { label: 'C' }] }] } } });
      spyOn(formActions, 'change');
      actions.sortValues()(dispatch, getState);
      expect(formActions.change)
      .toHaveBeenCalledWith('thesauri.data.values', [{ label: 'A', values: [{ label: 'C' }, { label: 'D' }] }, { label: 'B' }]);
    });
  });

  describe('moveValues()', () => {
    beforeEach(() => {
      getState.and.returnValue({
        thesauri: { data: { values: [
          { label: 'B', id: 1 },
          { label: 'A', id: 2, values: [{ label: 'D', id: 3 }, { label: 'C', id: 4 }, { label: '' }] },
          { label: '' }
        ] } }
      });
      spyOn(formActions, 'change');
    });

    describe('moving to a group', () => {
      it('should move the values to the given group', () => {
        actions.moveValues([{ label: 'B', id: 1 }], 1)(dispatch, getState);
        expect(formActions.change)
        .toHaveBeenCalledWith('thesauri.data.values', [
          {
            label: 'A',
            id: 2,
            values: [
              { label: 'D', id: 3 },
              { label: 'C', id: 4 },
              { label: 'B', id: 1 }
            ]
          },
          { label: '' }
        ]);
      });
    });

    describe('moving outside a group', () => {
      it('should remove from groups and put it ouside', () => {
        actions.moveValues([{ label: 'C', id: 4 }])(dispatch, getState);
        expect(formActions.change)
        .toHaveBeenCalledWith('thesauri.data.values', [
          { label: 'B', id: 1 },
          {
            label: 'A',
            id: 2,
            values: [
              { label: 'D', id: 3 },
              { label: '' }
            ]
          },
          { label: 'C', id: 4 }
        ]);
      });
    });
  });
});
