import {mockID} from 'shared/uniqueID';
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
        let id = 'id';
        let action = actions.removeNotification(id);

        expect(action).toEqual({type: types.REMOVE_NOTIFICATION, id: 'id'});
      });
    });

    describe('notify', () => {
      it('should add a notification and removeIt after 3000ms', () => {
        let message = 'message';
        let type = 'type';

        actions.notify(message, type)(dispatch);

        expect(dispatch).toHaveBeenCalledWith({type: types.NOTIFY, notification: {message: 'message', type: 'type', id: 'unique_id'}});
        jasmine.clock().tick(3000);
        expect(dispatch).toHaveBeenCalledWith({type: types.REMOVE_NOTIFICATION, id: 'unique_id'});
      });
    });
  });
});
