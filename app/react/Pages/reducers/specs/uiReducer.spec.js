import {fromJS} from 'immutable';

import reducer from '../uiReducer';
import * as actions from 'app/Pages/actions/actionTypes';
import 'jasmine-immutablejs-matchers';

describe('uiReducer', () => {
  describe('when state is undefined', () => {
    it('should return initial state', () => {
      let newState = reducer();
      expect(newState).toEqual(fromJS({}));
    });
  });

  describe('SAVING_PAGE', () => {
    it('should set savingPage true', () => {
      let newState = reducer(fromJS({}), {type: actions.SAVING_PAGE});
      expect(newState).toEqualImmutable(fromJS({savingPage: true}));
    });
  });

  describe('PAGE_SAVED', () => {
    it('should set savingPage false', () => {
      let newState = reducer(fromJS({}), {type: actions.PAGE_SAVED});
      expect(newState).toEqualImmutable(fromJS({savingPage: false}));
    });
  });
});
