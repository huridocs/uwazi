import { mockID } from 'shared/uniqueID';
import * as actions from 'app/Notifications/actions/notificationsActions';
import * as types from 'app/Notifications/actions/actionTypes';

describe('notificationsActions', () => {
  describe('async actions', () => {
    let dispatch;

    beforeEach(() => {
      mockID();
      dispatch = jasmine.createSpy('dispatch');
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    describe('removeNotification', () => {
      it('should remove a notification by id', () => {
        const id = 'id';
        const action = actions.removeNotification(id);

        expect(action).toEqual({ type: types.REMOVE_NOTIFICATION, id: 'id' });
      });
    });

    describe('notify', () => {
      it('should add a notification and removeIt after 1500ms', () => {
        const message = 'message';
        const type = 'type';

        actions.notify(message, type, 1000)(dispatch);

        expect(dispatch).toHaveBeenCalledWith({ type: types.NOTIFY, notification: { message: 'message', type: 'type', id: 'unique_id' } });
        jasmine.clock().tick(1500);
        expect(dispatch).toHaveBeenCalledWith({ type: types.REMOVE_NOTIFICATION, id: 'unique_id' });
      });
    });
  });
});
