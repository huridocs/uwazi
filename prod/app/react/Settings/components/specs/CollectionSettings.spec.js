"use strict";var _react = _interopRequireDefault(require("react"));
var _RequestParams = require("../../../utils/RequestParams");

var _enzyme = require("enzyme");

var _reactReduxForm = require("react-redux-form");
var _CollectionSettings = require("../CollectionSettings");
var _SettingsAPI = _interopRequireDefault(require("../../SettingsAPI"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('CollectionSettings', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      settings: {
        _id: 'id',
        dateFormat: 'DD-MM-YYYY',
        allowedPublicTemplates: ['existingId1', 'existingId2'] },

      notify: jasmine.createSpy('notify'),
      setSettings: jasmine.createSpy('setSettings') };

    component = (0, _enzyme.shallow)(_react.default.createElement(_CollectionSettings.CollectionSettings, props));
  });

  describe('constructor', () => {
    it('should assign the initial state correctly', () => {
      expect(component.state().dateSeparator).toBe('-');
      expect(component.state().dateFormat).toBe(1);
      expect(component.state().customLandingpage).toBe(false);
      expect(component.state().allowedPublicTemplatesString).toBe('existingId1,existingId2');
    });

    it('should not fail on missing values', () => {
      delete props.settings.allowedPublicTemplates;
      component = (0, _enzyme.shallow)(_react.default.createElement(_CollectionSettings.CollectionSettings, props));
      expect(component.state().allowedPublicTemplatesString).toBe('');
    });
  });

  describe('updateSettings', () => {
    let values;
    let expectedData;

    beforeEach(() => {
      spyOn(_SettingsAPI.default, 'save').and.returnValue(Promise.resolve());
      values = {
        _id: 'id',
        _rev: 'rev',
        site_name: 'Uwazi',
        home_page: 'I should be removed',
        mailerConfig: 'config',
        analyticsTrackingId: 'X-123-Y',
        dateFormat: 2,
        dateSeparator: '/',
        customLandingpage: false,
        matomoConfig: 'matomo',
        private: false,
        allowedPublicTemplatesString: 'id1,id2' };


      expectedData = {
        _id: 'id',
        _rev: 'rev',
        analyticsTrackingId: 'X-123-Y',
        dateFormat: 'MM/DD/YYYY',
        home_page: '',
        mailerConfig: 'config',
        matomoConfig: 'matomo',
        private: false,
        site_name: 'Uwazi',
        allowedPublicTemplates: ['id1', 'id2'] };


      component = (0, _enzyme.shallow)(_react.default.createElement(_CollectionSettings.CollectionSettings, props));
      component.find(_reactReduxForm.LocalForm).simulate('submit', values);
    });

    it('should sanitize the form data', () => {
      expect(_SettingsAPI.default.save).toHaveBeenCalledWith(new _RequestParams.RequestParams(expectedData));
    });

    it('should parse empty allowedPublicTemplates values as empty array', () => {
      values.allowedPublicTemplatesString = '';
      expectedData.allowedPublicTemplates = [];

      component = (0, _enzyme.shallow)(_react.default.createElement(_CollectionSettings.CollectionSettings, props));
      component.find(_reactReduxForm.LocalForm).simulate('submit', values);

      expect(_SettingsAPI.default.save).toHaveBeenCalledWith(new _RequestParams.RequestParams(expectedData));
    });
  });
});