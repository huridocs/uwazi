import Immutable from 'immutable';

import reducer from 'app/Templates/reducers/uiReducer';
import * as actions from 'app/Templates/actions/actionTypes';

describe('uiReducer', () => {
  describe('when state is undefined', () => {
    it('should return initial state', () => {
      const newState = reducer();
      expect(newState).toEqual(
        Immutable.fromJS({ thesauris: [], templates: [], propertyBeingDeleted: null })
      );
    });
  });

  describe('SAVING_TEMPLATE', () => {
    it('should set savingTemplate true', () => {
      const newState = reducer(Immutable.fromJS({}), { type: actions.SAVING_TEMPLATE });
      expect(newState.toJS()).toEqual({ savingTemplate: true });
    });
  });

  describe('TEMPLATE_SAVED', () => {
    it('should set savingTemplate false', () => {
      const newState = reducer(Immutable.fromJS({}), { type: actions.TEMPLATE_SAVED });
      expect(newState.toJS()).toEqual({ savingTemplate: false });
    });
  });

  describe('EDIT_PROPERTY', () => {
    it('should set editingProperty to the action id', () => {
      const newState = reducer(Immutable.fromJS({}), {
        type: actions.EDIT_PROPERTY,
        id: 'test id',
      });
      expect(newState.toJS()).toEqual({ editingProperty: 'test id' });
    });
  });

  describe('SET_THESAURIS', () => {
    it('should set thesauris list on thesauris', () => {
      const newState = reducer(Immutable.fromJS({}), {
        type: actions.SET_THESAURIS,
        thesauris: 'thesauris',
      });
      expect(newState.toJS()).toEqual({ thesauris: 'thesauris' });
    });
  });

  describe('SET_TEMPLATES', () => {
    it('should set templates list on templates', () => {
      const newState = reducer(Immutable.fromJS({}), {
        type: actions.SET_TEMPLATES,
        templates: 'templates',
      });
      expect(newState.toJS()).toEqual({ templates: 'templates' });
    });
  });
});
