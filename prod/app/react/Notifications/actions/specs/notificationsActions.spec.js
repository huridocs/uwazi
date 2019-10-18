"use strict";var _uniqueID = require("../../../../shared/uniqueID");
var actions = _interopRequireWildcard(require("../notificationsActions"));
var types = _interopRequireWildcard(require("../actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

describe('notificationsActions', () => {
  describe('async actions', () => {
    let dispatch;

    beforeEach(() => {
      (0, _uniqueID.mockID)();
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

        const id = actions.notify(message, type, 1000)(dispatch);
        expect(id).toBe('unique_id');
        expect(dispatch).toHaveBeenCalledWith({ type: types.NOTIFY, notification: { message: 'message', type: 'type', id: 'unique_id' } });
        jasmine.clock().tick(1500);
        expect(dispatch).toHaveBeenCalledWith({ type: types.REMOVE_NOTIFICATION, id: 'unique_id' });
      });

      describe('when delay is false', () => {
        it('should not remove the notification', () => {
          const message = 'message';
          const type = 'type';
          actions.notify(message, type, false)(dispatch);
          expect(dispatch).toHaveBeenCalledWith({ type: types.NOTIFY, notification: { message: 'message', type: 'type', id: 'unique_id' } });
          jasmine.clock().tick(6001);
          expect(dispatch).not.toHaveBeenCalledWith({ type: types.REMOVE_NOTIFICATION, id: 'unique_id' });
        });
      });
    });
  });
});