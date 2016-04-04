import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import backend from 'fetch-mock';

import {APIURL} from 'app/config.js';
import * as actions from 'app/Templates/actions/templateActions';
import * as notifications from 'app/Notifications/actions/notificationsActions';
import * as types from 'app/Templates/actions/actionTypes';
import * as notificationsTypes from 'app/Notifications/actions/actionTypes';
import {mockID} from 'app/utils/uniqueID';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('templatesActions', () => {
  beforeEach(() => {
    mockID();
  });

  describe('addProperty()', () => {
    it('should return an ADD_PROPERTY type action with config, unique config.id and index passed', () => {
      let action = actions.addProperty({name: 'test'}, 'index !');
      expect(action).toEqual({type: types.ADD_PROPERTY, config: {name: 'test', id: 'unique_id'}, index: 'index !'});
    });

    it('should return default config object and index if nothing passed', () => {
      let action = actions.addProperty();
      expect(action).toEqual({type: types.ADD_PROPERTY, config: {id: 'unique_id'}, index: 0});
    });
  });

  describe('updateTemplate()', () => {
    it('should return an UPDATE_TEMPLATE type action with template passed', () => {
      let action = actions.updateTemplate({name: 'test'});
      expect(action).toEqual({type: types.UPDATE_TEMPLATE, template: {name: 'test'}});
    });
  });

  describe('updateProperty()', () => {
    it('should return an UPDATE_PROPERTY type action with the new property config', () => {
      let config = {name: 'super name'};
      let action = actions.updateProperty(config, 2);
      expect(action).toEqual({type: types.UPDATE_PROPERTY, config: {name: 'super name'}, index: 2});
    });
  });

  describe('selectProperty()', () => {
    it('should return an SELECT_PROPERTY type action with the property index', () => {
      let action = actions.selectProperty('property index');
      expect(action).toEqual({type: types.SELECT_PROPERTY, index: 'property index'});
    });
  });

  describe('setTemplate()', () => {
    it('should return a SET_TEMPLATE type action with the template passed', () => {
      let action = actions.setTemplate('template');
      expect(action).toEqual({type: types.SET_TEMPLATE, template: 'template'});
    });
  });

  describe('resetTemplate()', () => {
    it('should return a RESET_TEMPLATE type action with the template passed', () => {
      let action = actions.resetTemplate();
      expect(action).toEqual({type: types.RESET_TEMPLATE});
    });
  });

  describe('removeProperty', () => {
    it('should return a REMOVE_FIELD type action with index passed', () => {
      let action = actions.removeProperty(55);
      expect(action).toEqual({type: types.REMOVE_PROPERTY, index: 55});
    });
  });

  describe('reorderProperty', () => {
    it('should return a REORDER_PROPERTY type action with origin and target indexes', () => {
      let action = actions.reorderProperty(1, 2);
      expect(action).toEqual({type: types.REORDER_PROPERTY, originIndex: 1, targetIndex: 2});
    });
  });

  describe('async actions', () => {
    beforeEach(() => {
      spyOn(notifications, 'notify');
      backend.restore();
      backend
      .mock(APIURL + 'templates', 'POST', {body: JSON.stringify({testBackendResult: 'ok'})});
    });

    describe('saveTemplate', () => {
      it('should save the template and dispatch a TEMPLATE_SAVED action', (done) => {
        let originalTemplateData = {name: 'my template', properties: [{id: 'a1b2', label: 'my property'}, {id: 'a1b3', label: 'my property'}]};

        const expectedActions = [
          {type: types.TEMPLATE_SAVED, data: {testBackendResult: 'ok'}},
          {type: notificationsTypes.NOTIFY, notification: {message: 'saved successfully !', type: 'info', id: 'unique_id'}}
        ];
        const store = mockStore({});

        store.dispatch(actions.saveTemplate(originalTemplateData))
        .then(() => {
          expect(store.getActions()).toEqual(expectedActions);
          expect(originalTemplateData.properties[0].id).toBe('a1b2');
        })
        .then(done)
        .catch(done.fail);
      });
    });
  });
});
