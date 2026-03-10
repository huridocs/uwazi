import Immutable from 'immutable';

import uiReducer, { initialState as rawInitialState } from '../uiReducer';
import * as actions from '../../actions/uiActions';

describe('uiReducer', () => {
  const initialState = Immutable.fromJS(rawInitialState);

  describe('when state is undefined', () => {
    it('returns initial', () => {
      const newState = uiReducer();
      expect(newState).toEqual(initialState);
    });
  });

  describe('when showTab', () => {
    it('should set tab passed, set userSelectedTab to true and showFilters to false', () => {
      const newState = uiReducer(initialState, actions.showTab('tab'));
      expect(newState.toJS()).toEqual({ tab: 'tab', userSelectedTab: true, showFilters: false });
    });
  });

  describe('when resetUserSelectedTab', () => {
    it('should set userSelectedTab to false', () => {
      const intermidiateState = uiReducer(initialState, actions.showTab('tab'));
      expect(intermidiateState.toJS().userSelectedTab).toBe(true);
      const newState = uiReducer(intermidiateState, actions.resetUserSelectedTab());
      expect(newState.toJS().userSelectedTab).toBe(false);
    });
  });

  describe('when showFilters', () => {
    it('should set tab to connections and filters true', () => {
      const newState = uiReducer(initialState, actions.showFilters());
      expect(newState.toJS()).toEqual(
        expect.objectContaining({ tab: 'connections', showFilters: true })
      );
    });
  });

  describe('when hideFilters', () => {
    it('should set show filters false', () => {
      const newState = uiReducer(initialState, actions.hideFilters());
      expect(newState.toJS()).toEqual(expect.objectContaining({ showFilters: false }));
    });
  });
});
