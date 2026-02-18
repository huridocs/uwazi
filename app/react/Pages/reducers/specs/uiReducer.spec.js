import Immutable from 'immutable';

import * as actions from '#app/Pages/actions/actionTypes.js';
import { pagesUI as reducer } from '../uiReducer.js';

describe('uiReducer', () => {
  describe('when state is undefined', () => {
    it('should return initial state', () => {
      const newState = reducer();
      expect(newState).toEqual(Immutable.fromJS({}));
    });
  });

  describe('SAVING_PAGE', () => {
    it('should set savingPage true', () => {
      const newState = reducer(Immutable.fromJS({}), { type: actions.SAVING_PAGE });
      expect(newState.toJS()).toEqual({ savingPage: true });
    });
  });

  describe('PAGE_SAVED', () => {
    it('should set savingPage false', () => {
      const newState = reducer(Immutable.fromJS({}), { type: actions.PAGE_SAVED });
      expect(newState.toJS()).toEqual({ savingPage: false });
    });
  });
});
