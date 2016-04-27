import * as actions from 'app/Modals/actions/modalActions';
import * as types from 'app/Modals/actions/actionTypes';

describe('modalsActions', () => {
  describe('showModal', () => {
    it('should return a SHOW_MODAL action with modal name and data', () => {
      let action = actions.showModal('modalName', {data: 'data'});
      expect(action).toEqual({type: types.SHOW_MODAL, modal: 'modalName', data: {data: 'data'}});
    });
  });
  describe('hideModal', () => {
    it('should return a HIDE_MODAL action with modal name', () => {
      let action = actions.hideModal('modalName');
      expect(action).toEqual({type: types.HIDE_MODAL, modal: 'modalName'});
    });
  });
});
