import * as actions from 'app/Library/actions/libraryActions';
import * as types from 'app/Library/actions/actionTypes';

describe('libraryActions', () => {
  describe('setDocuments', () => {
    it('should return a SET_DOCUMENTS action ', () => {
      let documents = [{name: 'Secret list of things'}];
      let action = actions.setDocuments(documents);
      expect(action).toEqual({type: types.SET_DOCUMENTS, documents});
    });
  });
});
