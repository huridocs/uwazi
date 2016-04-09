import * as actions from 'app/Viewer/actions/referencesActions';
import * as types from 'app/Viewer/actions/actionTypes';

describe('referencesActions', () => {
  describe('setReferences()', () => {
    it('should return a SET_REFERENCES type action with the references', () => {
      let action = actions.setReferences('references');
      expect(action).toEqual({type: types.SET_REFERENCES, references: 'references'});
    });
  });
});
