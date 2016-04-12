import resultsReducer from 'app/Viewer/reducers/resultsReducer';
import * as types from 'app/Viewer/actions/actionTypes';

describe('resultsReducer', () => {
  describe('when state is undefined', () => {
    it('return initial state', () => {
      let newState = resultsReducer();
      expect(newState).toEqual([]);
    });
  });

  describe('SET_VIEWER_RESULTS', () => {
    it('should set results passed', () => {
      let newState = resultsReducer(null, {type: types.SET_VIEWER_RESULTS, results: 'results'});
      let expected = 'results';

      expect(newState).toEqual(expected);
    });
  });
});
