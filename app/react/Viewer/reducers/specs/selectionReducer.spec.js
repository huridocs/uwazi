import selectionReducer from 'app/Viewer/reducers/selectionReducer';
import * as types from 'app/Viewer/actions/actionTypes';

describe('selectionReducer', () => {
  describe('when state is undefined', () => {
    it('return initial state', () => {
      let newState = selectionReducer();
      expect(newState).toEqual(null);
    });
  });

  describe('SET_SELECTION', () => {
    it('should set selection passed', () => {
      let newState = selectionReducer(null, {type: types.SET_SELECTION, selection: 'selection'});
      let expected = 'selection';

      expect(newState).toEqual(expected);
    });
  });

  describe('UNSET_SELECTION', () => {
    it('should unset selection', () => {
      let newState = selectionReducer('currentState', {type: types.UNSET_SELECTION});
      let expected = null;

      expect(newState).toEqual(expected);
    });
  });
  describe('RESET_DOCUMENT_VIEWER', () => {
    it('should unset selection', () => {
      let newState = selectionReducer('currentState', {type: types.RESET_DOCUMENT_VIEWER});
      let expected = null;

      expect(newState).toEqual(expected);
    });
  });
});
