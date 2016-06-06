import Immutable from 'immutable';

import reducer from 'app/Templates/reducers/uiReducer';
import * as actions from 'app/Templates/actions/actionTypes';
import 'jasmine-immutablejs-matchers';

describe('uiReducer', () => {
  describe('when state is undefined', () => {
    it('should return initial state', () => {
      let newState = reducer();
      expect(newState).toEqual(Immutable.fromJS({thesauris: [], templates: [], propertyBeingDeleted: null}));
    });
  });

  describe('SAVING_TEMPLATE', () => {
    it('should set savingTemplate true', () => {
      let newState = reducer(Immutable.fromJS({}), {type: actions.SAVING_TEMPLATE});
      expect(newState).toEqualImmutable(Immutable.fromJS({savingTemplate: true}));
    });
  });

  describe('TEMPLATE_SAVED', () => {
    it('should set savingTemplate false', () => {
      let newState = reducer(Immutable.fromJS({}), {type: actions.TEMPLATE_SAVED});
      expect(newState).toEqualImmutable(Immutable.fromJS({savingTemplate: false}));
    });
  });

  describe('EDIT_PROPERTY', () => {
    it('should set editingProperty to the action id', () => {
      let newState = reducer(Immutable.fromJS({}), {type: actions.EDIT_PROPERTY, id: 'test id'});
      expect(newState).toEqualImmutable(Immutable.fromJS({editingProperty: 'test id'}));
    });
  });

  describe('SET_THESAURIS', () => {
    it('should set thesauris list on thesauris', () => {
      let newState = reducer(Immutable.fromJS({}), {type: actions.SET_THESAURIS, thesauris: 'thesauris'});
      expect(newState).toEqualImmutable(Immutable.fromJS({thesauris: 'thesauris'}));
    });
  });

  describe('SET_TEMPLATES', () => {
    it('should set templates list on templates', () => {
      let newState = reducer(Immutable.fromJS({}), {type: actions.SET_TEMPLATES, templates: 'templates'});
      expect(newState).toEqualImmutable(Immutable.fromJS({templates: 'templates'}));
    });
  });
});
