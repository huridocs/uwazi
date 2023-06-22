import configureMockStore from 'redux-mock-store';
import backend from 'fetch-mock';
import superagent from 'superagent';
import { APIURL } from 'app/config.js';
import { mockID } from 'shared/uniqueID';
import thunk from 'redux-thunk';
import { actions as formActions } from 'react-redux-form';

import * as actions from 'app/Thesauri/actions/thesauriActions';
import * as types from 'app/Thesauri/actions/actionTypes';
import * as notificationsTypes from 'app/Notifications/actions/actionTypes';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('thesaurisActions', () => {
  let dispatch;
  let getState;

  beforeEach(() => {
    mockID();

    dispatch = jasmine.createSpy('dispatch');
    getState = jasmine
      .createSpy('getState')
      .and.returnValue({ thesauri: { data: { values: [{ label: 'something' }, { label: '' }] } } });
    backend.restore();
    backend.post(`${APIURL}thesauris`, { body: JSON.stringify({ testBackendResult: 'ok' }) });
  });

  afterEach(() => backend.restore());

  describe('saveThesaurus', () => {
    it('should save the thesauri and dispatch a thesauriSaved action and a notify', done => {
      const expectedActions = [
        { type: types.THESAURI_SAVED },
        {
          type: notificationsTypes.NOTIFY,
          notification: { message: 'Thesaurus saved', type: 'success', id: 'unique_id' },
        },
        {
          type: 'rrf/change',
          model: 'thesauri.data',
          value: { testBackendResult: 'ok' },
          silent: false,
          multi: false,
          external: true,
        },
      ];
      const store = mockStore({});

      const data = { name: 'Secret list of things', values: [] };
      store
        .dispatch(actions.saveThesaurus(data))
        .then(() => {
          expect(store.getActions()).toEqual(expectedActions);
        })
        .then(done)
        .catch(done.fail);

      expect(JSON.parse(backend.lastOptions(`${APIURL}thesauris`).body)).toEqual(data);
    });
  });

  describe('importThesaurus', () => {
    const mockSuperAgent = (url = `${APIURL}thesauris`) => {
      const mockUpload = superagent.post(url);
      spyOn(mockUpload, 'field').and.returnValue(mockUpload);
      spyOn(mockUpload, 'attach').and.returnValue(mockUpload);
      spyOn(superagent, 'post').and.returnValue(mockUpload);
      return mockUpload;
    };
    it('should save thesaurus, import csv data and notify', done => {
      const thesaurus = { _id: 'foo', name: 'Bar', values: [] };
      const store = mockStore({});
      const mockUpload = mockSuperAgent();
      const file = {
        name: 'filename.csv',
      };

      const resp = { _id: 'foo', name: 'Bar', values: [{ label: 'val' }] };

      const expectedActions = [
        { type: types.THESAURI_SAVED },
        {
          type: notificationsTypes.NOTIFY,
          notification: { message: 'Data imported', type: 'success', id: 'unique_id' },
        },
        {
          type: 'rrf/change',
          model: 'thesauri.data',
          value: resp,
          silent: false,
          multi: false,
          external: true,
        },
      ];

      store.dispatch(actions.importThesaurus(thesaurus, file)).then(() => {
        expect(superagent.post).toHaveBeenCalledWith(`${APIURL}thesauris`);
        expect(mockUpload.attach).toHaveBeenCalledWith('file', file, file.name);
        expect(mockUpload.field).toHaveBeenCalledWith('thesauri', JSON.stringify(thesaurus));
        expect(store.getActions()).toEqual(expectedActions);
        done();
      });

      mockUpload.emit('response', { text: JSON.stringify(resp), status: 200 });
    });

    it.each`
      property           | message
      ${'error'}         | ${'unformatted error'}
      ${'prettyMessage'} | ${'formatted error'}
    `('should notify error if error is returned', ({ property, message }, done) => {
      const thesaurus = {};
      const file = {};
      const store = mockStore({});
      const mockUpload = mockSuperAgent();

      const expectedActions = [
        {
          type: notificationsTypes.NOTIFY,
          notification: { message, type: 'danger', id: 'unique_id' },
        },
      ];

      store.dispatch(actions.importThesaurus(thesaurus, file)).then(() => {
        expect(superagent.post).toHaveBeenCalledWith(`${APIURL}thesauris`);
        expect(store.getActions()).toEqual(expectedActions);
        done();
      });

      mockUpload.emit('response', {
        text: JSON.stringify({ [property]: message }),
        status: 400,
      });
    });
  });

  describe('addValue()', () => {
    it('should add an empty value to the thesauri', () => {
      getState.and.returnValue({ thesauri: { data: { values: [{ label: 'something' }] } } });
      spyOn(formActions, 'change');
      actions.addValue()(dispatch, getState);
      expect(formActions.change).toHaveBeenCalledWith('thesauri.data.values', [
        { label: 'something' },
        { label: '', id: 'unique_id' },
      ]);
    });
  });

  describe('addGroup()', () => {
    it('should add a new group at the end', () => {
      spyOn(formActions, 'change');
      actions.addGroup()(dispatch, getState);
      expect(formActions.change).toHaveBeenCalledWith('thesauri.data.values', [
        { label: 'something' },
        { label: '', id: 'unique_id', values: [{ label: '', id: 'unique_id' }] },
      ]);
    });
  });

  describe('removeValue()', () => {
    it('should remove the value from the list', () => {
      getState.and.returnValue({
        thesauri: {
          data: {
            values: [
              { label: 'B', id: 1 },
              {
                label: 'A',
                id: 2,
                values: [{ label: 'D', id: 3 }, { label: 'C', id: 4 }, { label: '' }],
              },
              { label: '' },
            ],
          },
        },
      });
      spyOn(formActions, 'change');
      actions.removeValue(0)(dispatch, getState);
      expect(formActions.change).toHaveBeenCalledWith('thesauri.data.values', [
        {
          label: 'A',
          id: 2,
          values: [{ label: 'D', id: 3 }, { label: 'C', id: 4 }, { label: '' }],
        },
        { label: '' },
      ]);

      actions.removeValue(0, 1)(dispatch, getState);
      expect(formActions.change).toHaveBeenCalledWith('thesauri.data.values', [
        { label: 'B', id: 1 },
        { label: 'A', id: 2, values: [{ label: 'C', id: 4 }, { label: '' }] },
        { label: '' },
      ]);
    });
    it('should remove value from group even when group has index 0', () => {
      getState.and.returnValue({
        thesauri: {
          data: {
            values: [
              {
                label: 'A',
                id: 2,
                values: [{ label: 'D', id: 3 }, { label: 'C', id: 4 }, { label: '' }],
              },
              { label: 'B', id: 1 },
              { label: '' },
            ],
          },
        },
      });
      spyOn(formActions, 'change');
      actions.removeValue(1, 0)(dispatch, getState);
      expect(formActions.change).toHaveBeenCalledWith('thesauri.data.values', [
        { label: 'A', id: 2, values: [{ label: 'D', id: 3 }, { label: '' }] },
        { label: 'B', id: 1 },
        { label: '' },
      ]);
    });
  });

  describe('sortValues()', () => {
    it('should sort the values', () => {
      getState.and.returnValue({
        thesauri: {
          data: {
            values: [{ label: 'B' }, { label: 'A', values: [{ label: 'D' }, { label: 'C' }] }],
          },
        },
      });
      spyOn(formActions, 'change');
      actions.sortValues()(dispatch, getState);
      expect(formActions.change).toHaveBeenCalledWith('thesauri.data.values', [
        { label: 'A', values: [{ label: 'C' }, { label: 'D' }] },
        { label: 'B' },
      ]);
    });
  });

  describe('updateValues', () => {
    let values;
    beforeEach(() => {
      values = [
        { label: '1', id: '1' },
        { label: '2', id: '2' },
        { label: '3', id: '3' },
        { label: '', id: '4' },
      ];
      spyOn(formActions, 'change');
    });

    it('should set the updated values in the store', () => {
      actions.updateValues(values)(dispatch, getState);
      expect(formActions.change).toHaveBeenCalledWith('thesauri.data.values', values);
    });
    it('should update values inside group if group index is provided', () => {
      getState.and.returnValue({
        thesauri: {
          data: {
            values: [
              { label: 'root1', id: 'root1' },
              { label: 'group', id: 'group', values: [] },
            ],
          },
        },
      });
      actions.updateValues(values, 1)(dispatch, getState);
      expect(formActions.change).toHaveBeenCalledWith('thesauri.data.values', [
        { label: 'root1', id: 'root1' },
        { label: 'group', id: 'group', values },
      ]);
    });
    it('should not remove a group from the root list', () => {
      getState.and.returnValue({
        thesauri: {
          data: {
            values: [
              { label: 'root1', id: 'root1' },
              { label: 'group', id: 'group', values: [] },
            ],
          },
        },
      });
      actions.updateValues(values)(dispatch, getState);
      expect(formActions.change).not.toHaveBeenCalled();
    });
    it('should not move a group inside a group', () => {
      getState.and.returnValue({
        thesauri: {
          data: {
            values: [
              { label: 'root1', id: 'root1' },
              { label: 'group', id: 'group', values: [] },
            ],
          },
        },
      });
      values[2].values = [{ label: '3.1', id: '3.1' }];
      actions.updateValues(values, 1)(dispatch, getState);
      expect(formActions.change).not.toHaveBeenCalled();
    });
    describe('if there is a single empty item inside the list', () => {
      it('should move the empty item to the bottom of the list', () => {
        const newValues = [...values];
        const expectedValues = [...values];
        newValues.push({ label: '5', id: '5' });
        expectedValues.splice(3, 0, { label: '5', id: '5' });
        actions.updateValues(newValues)(dispatch, getState);
        expect(formActions.change).toHaveBeenCalledWith('thesauri.data.values', expectedValues);
      });
    });
    describe('if there are multiple empty items in the list', () => {
      it('should not update the store', () => {
        values.push({ label: '', id: '5' });
        values.push({ label: '6', id: '6' });
        actions.updateValues(values)(dispatch, getState);
        expect(formActions.change).not.toHaveBeenCalled();
      });
    });
  });
});
