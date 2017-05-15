import * as entityActions from '../../actions/actions';
import entitiesUtils from '../../utils/filterBaseProperties';

import {mapDispatchToProps} from '../EntityForm';

describe('Viewer EntityForm', () => {
  describe('mapDispatchToProps', () => {
    beforeEach(() => {
      spyOn(entityActions, 'saveEntity');
      spyOn(entitiesUtils, 'filterBaseProperties').and.callFake(data => 'filtered ' + data);
    });

    it('should only send document base data on submit', () => {
      expect(entityActions.saveEntity).not.toHaveBeenCalled();
      mapDispatchToProps(() => {}).onSubmit('data');
      expect(entityActions.saveEntity).toHaveBeenCalledWith('filtered data');
    });
  });
});
