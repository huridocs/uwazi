"use strict";var _reactReduxForm = require("react-redux-form");
var _RequestParams = require("../../../utils/RequestParams");

var _BasicReducer = require("../../../BasicReducer");
var _uniqueID = require("../../../../shared/uniqueID");

var _Notifications = require("../../../Notifications");

var _SettingsAPI = _interopRequireDefault(require("../../SettingsAPI"));
var uiActions = _interopRequireWildcard(require("../uiActions"));

var actions = _interopRequireWildcard(require("../navlinksActions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Settings/Navlinks actions', () => {
  let dispatch;

  beforeEach(() => {
    (0, _uniqueID.mockID)();
    dispatch = jasmine.createSpy('dispatch');
    spyOn(_SettingsAPI.default, 'save').and.returnValue(Promise.resolve({ _id: 'newId', _rev: 'newRev' }));
    spyOn(_reactReduxForm.actions, 'load').and.returnValue('ITEMS LOADED');
    spyOn(uiActions, 'editLink').and.returnValue('ITEM EDITED');
    spyOn(_reactReduxForm.actions, 'push').and.returnValue('ITEM PUSHED');
    spyOn(_reactReduxForm.actions, 'move').and.returnValue('ITEMS REORDERED');
    spyOn(_reactReduxForm.actions, 'remove').and.returnValue('ITEM REMOVED');
    spyOn(_BasicReducer.actions, 'set').and.returnValue('DATA SET');
    spyOn(_Notifications.notificationActions, 'notify').and.returnValue('NOTIFIED');
  });

  describe('loadLinks', () => {
    it('should load sent links into navlinksData', () => {
      expect(actions.loadLinks('links')).toBe('ITEMS LOADED');
      expect(_reactReduxForm.actions.load).toHaveBeenCalledWith('settings.navlinksData', { links: 'links' });
    });
  });

  describe('addLink', () => {
    it('should push a new item with default naming', () => {
      const expected = { title: 'Item 2', localID: 'unique_id' };
      actions.addLink([{ _id: 'existing link' }])(dispatch);
      expect(_reactReduxForm.actions.push).toHaveBeenCalledWith('settings.navlinksData.links', expected);
      expect(uiActions.editLink).toHaveBeenCalledWith('unique_id');
    });
  });

  describe('sortLink', () => {
    it('should reorder links', () => {
      expect(actions.sortLink(3, 2)).toBe('ITEMS REORDERED');
      expect(_reactReduxForm.actions.move).toHaveBeenCalledWith('settings.navlinksData.links', 3, 2);
    });
  });

  describe('removeLink', () => {
    it('should remove an existing item from the links', () => {
      expect(actions.removeLink(3)).toBe('ITEM REMOVED');
      expect(_reactReduxForm.actions.remove).toHaveBeenCalledWith('settings.navlinksData.links', 3);
    });
  });

  describe('saveLinks', () => {
    it('should dispatch a SAVING_NAVLINKS and save the data', () => {
      actions.saveLinks('data')(dispatch);
      expect(dispatch.calls.count()).toBe(1);
      expect(dispatch).toHaveBeenCalledWith({ type: 'SAVING_NAVLINKS' });
      expect(_SettingsAPI.default.save).toHaveBeenCalledWith(new _RequestParams.RequestParams('data'));
    });

    describe('on error', () => {
      it('should dispatch NAVLINKS_SAVED', async () => {
        _SettingsAPI.default.save.and.callFake(() => Promise.reject(new Error()));
        await actions.saveLinks('data')(dispatch);
        expect(dispatch).toHaveBeenCalledWith({ type: 'NAVLINKS_SAVED', data: 'data' });
      });
    });

    describe('upon success', () => {
      beforeEach(done => {
        actions.saveLinks('data')(dispatch).
        then(() => {
          done();
        });
      });

      it('should dispatch a NAVLINKS_SAVED with response', () => {
        expect(dispatch).toHaveBeenCalledWith({ type: 'NAVLINKS_SAVED', data: { _id: 'newId', _rev: 'newRev' } });
      });

      it('should set settings/collection to response', () => {
        expect(_BasicReducer.actions.set).toHaveBeenCalledWith('settings/collection', { _id: 'newId', _rev: 'newRev' });
        expect(dispatch).toHaveBeenCalledWith('DATA SET');
      });

      it('should notify saved successfully', () => {
        expect(_Notifications.notificationActions.notify).toHaveBeenCalledWith('Saved successfully.', 'success');
        expect(dispatch).toHaveBeenCalledWith('NOTIFIED');
      });
    });
  });
});