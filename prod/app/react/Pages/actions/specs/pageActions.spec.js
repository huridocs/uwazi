"use strict";var _reactRouter = require("react-router");
var _reactReduxForm = require("react-redux-form");
var _RequestParams = require("../../../utils/RequestParams");

var _BasicReducer = require("../../../BasicReducer");
var _Notifications = require("../../../Notifications");
var _PagesAPI = _interopRequireDefault(require("../../PagesAPI"));

var actions = _interopRequireWildcard(require("../pageActions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Page actions', () => {
  let dispatch;

  beforeEach(() => {
    dispatch = jasmine.createSpy('dispatch');
    spyOn(_PagesAPI.default, 'save').and.returnValue(Promise.resolve({ _id: 'newId', sharedId: 'newSharedId', _rev: 'newRev' }));
    spyOn(_PagesAPI.default, 'delete').and.returnValue(Promise.resolve());
    spyOn(_reactReduxForm.actions, 'reset').and.returnValue('PAGE DATA RESET');
    spyOn(_reactReduxForm.actions, 'merge').and.returnValue('PAGE DATA MERGED');
    spyOn(_BasicReducer.actions, 'remove').and.returnValue('PAGE REMOVED');
    spyOn(_Notifications.notificationActions, 'notify').and.returnValue('NOTIFIED');
    spyOn(_reactRouter.browserHistory, 'push');
  });

  describe('resetPage', () => {
    it('should dispatch a reset on page data', () => {
      actions.resetPage()(dispatch);
      expect(_reactReduxForm.actions.reset).toHaveBeenCalledWith('page.data');
      expect(dispatch).toHaveBeenCalledWith('PAGE DATA RESET');
    });
  });

  describe('savePage', () => {
    it('should dispatch a saving page and save the data', () => {
      actions.savePage('data')(dispatch);
      expect(dispatch.calls.count()).toBe(1);
      expect(dispatch).toHaveBeenCalledWith({ type: 'SAVING_PAGE' });
      expect(_PagesAPI.default.save).toHaveBeenCalledWith(new _RequestParams.RequestParams('data'));
    });

    describe('upon success', () => {
      beforeEach(done => {
        actions.savePage('data')(dispatch).
        then(() => {
          done();
        });
      });

      it('should dispatch a page saved with response', () => {
        expect(dispatch).toHaveBeenCalledWith({ type: 'PAGE_SAVED', data: { _id: 'newId', sharedId: 'newSharedId', _rev: 'newRev' } });
      });

      it('should merge response data', () => {
        expect(_reactReduxForm.actions.merge).toHaveBeenCalledWith('page.data', { _id: 'newId', sharedId: 'newSharedId', _rev: 'newRev' });
        expect(dispatch).toHaveBeenCalledWith('PAGE DATA MERGED');
      });

      it('should notify saved successfully', () => {
        expect(_Notifications.notificationActions.notify).toHaveBeenCalledWith('Saved successfully.', 'success');
        expect(dispatch).toHaveBeenCalledWith('NOTIFIED');
      });

      it('should navigate to pages edit with the sharedId', () => {
        expect(_reactRouter.browserHistory.push).toHaveBeenCalledWith('/settings/pages/edit/newSharedId');
      });
    });
    describe('on error', () => {
      it('should dispatch page saved', done => {
        _PagesAPI.default.save.and.callFake(() => Promise.reject(new Error()));
        actions.savePage('data')(dispatch).
        then(() => {
          expect(dispatch).toHaveBeenCalledWith({ type: 'PAGE_SAVED', data: {} });
          done();
        });
      });
    });
  });

  describe('deletePage', () => {
    const data = { sharedId: 'page1', _id: 'id' };
    it('should delete the page', () => {
      actions.deletePage(data)(dispatch);
      expect(_PagesAPI.default.delete).toHaveBeenCalledWith(new _RequestParams.RequestParams({ sharedId: 'page1' }));
    });

    describe('upon success', () => {
      beforeEach(done => {
        actions.deletePage(data)(dispatch).
        then(() => {
          done();
        });
      });

      it('should remove page', () => {
        expect(_BasicReducer.actions.remove).toHaveBeenCalledWith('pages', data);
        expect(dispatch).toHaveBeenCalledWith('PAGE REMOVED');
      });
    });
  });
});