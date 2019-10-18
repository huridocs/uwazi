"use strict";var _BasicReducer = require("../../../BasicReducer");
var _Notifications = require("../../../Notifications");
var _UsersAPI = _interopRequireDefault(require("../../UsersAPI"));
var _RequestParams = require("../../../utils/RequestParams");
var actions = _interopRequireWildcard(require("../actions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('User actions', () => {
  let dispatch;

  beforeEach(() => {
    dispatch = jasmine.createSpy('dispatch');
    spyOn(_UsersAPI.default, 'delete').and.returnValue(Promise.resolve());
    spyOn(_UsersAPI.default, 'save').and.returnValue(Promise.resolve());
    spyOn(_BasicReducer.actions, 'remove').and.returnValue('USER REMOVED');
    spyOn(_BasicReducer.actions, 'push').and.returnValue('USER PUSHED');
    spyOn(_Notifications.notificationActions, 'notify').and.returnValue('NOTIFIED');
  });

  describe('deleteUser', () => {
    it('should delete the user', () => {
      actions.deleteUser({ _id: '231' })(dispatch);
      expect(_UsersAPI.default.delete).toHaveBeenCalledWith(new _RequestParams.RequestParams({ _id: '231' }));
    });

    describe('upon success', () => {
      beforeEach(done => {
        actions.deleteUser('data')(dispatch).
        then(() => {
          done();
        });
      });

      it('should remove user', () => {
        expect(_BasicReducer.actions.remove).toHaveBeenCalledWith('users', 'data');
        expect(dispatch).toHaveBeenCalledWith('USER REMOVED');
        expect(dispatch).toHaveBeenCalledWith('NOTIFIED');
      });
    });
  });

  describe('saveUser', () => {
    const username = 'Spidey';
    const email = 'peter@parker.com';
    it('should save a new user', () => {
      actions.saveUser({ username, email })(dispatch);
      expect(_UsersAPI.default.save).toHaveBeenCalledWith(new _RequestParams.RequestParams({ username, email }));
    });

    describe('upon success', () => {
      beforeEach(done => {
        actions.saveUser({ username, email })(dispatch).
        then(() => {
          done();
        });
      });

      it('should remove user', () => {
        expect(_BasicReducer.actions.push).toHaveBeenCalledWith('users', { username, email });
        expect(dispatch).toHaveBeenCalledWith('USER PUSHED');
        expect(dispatch).toHaveBeenCalledWith('NOTIFIED');
      });
    });
  });
});