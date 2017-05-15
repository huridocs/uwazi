import * as documentActions from '../../actions/documentActions';
import entitiesUtils from 'app/Entities/utils/filterBaseProperties';

import {mapDispatchToProps} from '../DocumentForm';

describe('Viewer DocumentForm', () => {
  describe('mapDispatchToProps', () => {
    beforeEach(() => {
      spyOn(documentActions, 'saveDocument');
      spyOn(entitiesUtils, 'filterBaseProperties').and.callFake(data => 'filtered ' + data);
    });

    it('should only send document base data on submit', () => {
      expect(documentActions.saveDocument).not.toHaveBeenCalled();
      mapDispatchToProps(() => {}).onSubmit('data');
      expect(documentActions.saveDocument).toHaveBeenCalledWith('filtered data');
    });
  });
});
