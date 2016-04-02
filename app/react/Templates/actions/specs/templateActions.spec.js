import * as actions from '~/Templates/actions/templateActions';
import * as types from '~/Templates/actions/actionTypes';

import backend from 'fetch-mock';
import {APIURL} from '~/config.js';

describe('templatesActions', () => {
  beforeEach(() => {
    spyOn(Math, 'random').and.returnValue({
      toString() {
        return {
          substr() {
            return 'unique_id';
          }
        };
      }
    });
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
    let dispatch;
    beforeEach(() => {
      backend.restore();
      backend
      .mock(APIURL + 'templates', 'POST', {body: JSON.stringify({testBackendResult: 'ok'})});
      dispatch = jasmine.createSpy('dispatch');
    });

    describe('saveTemplate', () => {
      it('should save the template and dispatch a TEMPLATE_SAVED action', (done) => {
        let originalTemplateData = {name: 'my template', properties: [{id: 'a1b2', label: 'my property'}, {id: 'a1b3', label: 'my property'}]};
        let expectedSaveData = {name: 'my template', properties: [{label: 'my property'}, {label: 'my property'}]};
        actions.saveTemplate(originalTemplateData)(dispatch).then(() => {
          expect(dispatch).toHaveBeenCalledWith({type: types.TEMPLATE_SAVED, data: {testBackendResult: 'ok'}});
          done();
        });

        expect(JSON.parse(backend.lastOptions(APIURL + 'templates').body)).toEqual(expectedSaveData);
        expect(originalTemplateData.properties[0].id).toBe('a1b2');
      });
    });
  });
});
