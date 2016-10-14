import {fromJS as Immutable} from 'immutable';
import 'jasmine-immutablejs-matchers';

import uiReducer from '../uiReducer';

describe('Connections uiReducer', () => {
  describe('when state is undefined', () => {
    it('should return a default state', () => {
      let newState = uiReducer();
      expect(newState.toJS()).toEqual({open: false, connecting: false});
    });
  });

  describe('OPEN_CONNECTION_PANEL', () => {
    it('should set open true', () => {
      let newState = uiReducer(Immutable({}), {type: 'OPEN_CONNECTION_PANEL'});
      expect(newState.toJS()).toEqual({open: true});
    });
  });

  describe('CLOSE_CONNECTION_PANEL', () => {
    it('should reset connecting and set open to false', () => {
      let newState = uiReducer(Immutable({}), {type: 'CLOSE_CONNECTION_PANEL'});
      expect(newState.toJS()).toEqual({connecting: false, open: false});
    });
  });

  describe('SEARCHING_CONNECTIONS', () => {
    it('should set searching to true', () => {
      let newState = uiReducer(Immutable({}), {type: 'SEARCHING_CONNECTIONS'});
      expect(newState.toJS()).toEqual({searching: true});
    });
  });

  describe('upon setting results', () => {
    it('should set searching to false', () => {
      let newState = uiReducer(Immutable({}), {type: 'connections/searchResults/SET'});
      expect(newState.toJS()).toEqual({searching: false});
    });
  });

  describe('CREATING_CONNECTION', () => {
    it('should set creating to true', () => {
      let newState = uiReducer(Immutable({}), {type: 'CREATING_CONNECTION'});
      expect(newState.toJS()).toEqual({creating: true});
    });
  });

  describe('CREATING_RANGED_CONNECTION', () => {
    it('should set connecting to true', () => {
      let newState = uiReducer(Immutable({}), {type: 'CREATING_RANGED_CONNECTION'});
      expect(newState.toJS()).toEqual({connecting: true});
    });
  });

  describe('CANCEL_RANGED_CONNECTION', () => {
    it('should set connecting to false', () => {
      let newState = uiReducer(Immutable({}), {type: 'CANCEL_RANGED_CONNECTION'});
      expect(newState.toJS()).toEqual({connecting: false});
    });
  });

  describe('CONNECTION_CREATED', () => {
    it('should reset creating, connecting and close the panel', () => {
      let newState = uiReducer(Immutable({}), {type: 'CONNECTION_CREATED'});
      expect(newState.toJS()).toEqual({creating: false, connecting: false, open: false});
    });
  });
});
