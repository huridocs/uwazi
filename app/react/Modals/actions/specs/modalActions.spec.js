import * as actions from '#app/Modals/actions/modalActions.js';
import * as types from '#app/Modals/actions/actionTypes.js';

describe('modalsActions', () => {
  describe('showModal', () => {
    it('should return a SHOW_MODAL action with modal name and data', () => {
      const action = actions.showModal('modalName', { data: 'data' });
      expect(action).toEqual({
        type: types.SHOW_MODAL,
        modal: 'modalName',
        data: { data: 'data' },
      });
    });
  });
  describe('hideModal', () => {
    it('should return a HIDE_MODAL action with modal name', () => {
      const action = actions.hideModal('modalName');
      expect(action).toEqual({ type: types.HIDE_MODAL, modal: 'modalName' });
    });
  });
});
